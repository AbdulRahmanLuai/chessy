package com.chessy.chess_backend.controller.rest;

import com.chessy.chess_backend.dto.auth.AuthResponse;
import com.chessy.chess_backend.dto.auth.LoginRequest;
import com.chessy.chess_backend.dto.auth.RegisterRequest;
import com.chessy.chess_backend.entity.User;
import com.chessy.chess_backend.repository.UserRepository;
import com.chessy.chess_backend.service.RefreshTokenService;
import com.chessy.chess_backend.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    public static final String REFRESH_COOKIE_NAME = "rt";
    private static final int REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req,
                                      HttpServletResponse response) {
        logger.info("Registration attempt for username: {}, email: {}", req.getUsername(), req.getEmail());

        if (userRepository.existsByEmail(req.getEmail())) {
            logger.warn("Registration failed: email {} already in use", req.getEmail());
            return ResponseEntity.badRequest().body("Email already in use");
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            logger.warn("Registration failed: username {} already in use", req.getUsername());
            return ResponseEntity.badRequest().body("Username already in use");
        }

        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .displayName(req.getDisplayName())
                .username(req.getUsername())
                .build();

        userRepository.save(user);
        logger.info("User registered successfully: userId={}, username={}", user.getId(), user.getUsername());

        String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getUsername());
        String refreshTokenRaw = refreshTokenService.generateRefreshToken(user.getId());
        addRefreshCookie(response, refreshTokenRaw);
        logger.debug("Tokens issued and refresh cookie set for user {}", user.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(accessToken, user.getId().toString(), user.getEmail(), user.getDisplayName(), user.getUsername()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req,
                                   HttpServletResponse response) {
        String login = req.getLogin().trim();
        logger.info("Login attempt for login: {}", login);

        User user;
        if (login.contains("@")) {
            user = userRepository.findByEmail(login).orElse(null);
        } else {
            user = userRepository.findByUsername(login).orElse(null);
        }

        if (user == null) {
            logger.warn("Login failed: no user found for login {}", login);
        } else if (user.getPasswordHash() == null) {
            logger.warn("Login failed: user {} has no password hash (Google-only account)", user.getId());
        } else if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            logger.warn("Login failed: incorrect password for user {}", user.getId());
        } else {
            // Success
            String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getUsername());
            String refreshTokenRaw = refreshTokenService.generateRefreshToken(user.getId());
            addRefreshCookie(response, refreshTokenRaw);
            logger.info("User logged in: userId={}, username={}", user.getId(), user.getUsername());
            return ResponseEntity.ok(
                    new AuthResponse(accessToken, user.getId().toString(), user.getEmail(), user.getDisplayName(), user.getUsername()));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request,
                                     HttpServletResponse response) {
        logger.debug("Refresh token request received");

        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            logger.warn("Refresh failed: no cookies in request");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No refresh token cookie");
        }

        Optional<String> rawToken = Arrays.stream(cookies)
                .filter(c -> REFRESH_COOKIE_NAME.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();

        if (rawToken.isEmpty()) {
            logger.warn("Refresh failed: no 'rt' cookie found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing refresh token cookie");
        }

        RefreshTokenService.RefreshTokenResult result = refreshTokenService.validateAndRotate(rawToken.get());
        if (result == null) {
            logger.warn("Refresh failed: invalid or expired refresh token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired refresh token");
        }

        User user = userRepository.findById(result.userId()).orElseThrow();
        String newAccessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getUsername());
        addRefreshCookie(response, result.newRawToken());
        logger.info("Token refreshed for user {}", user.getId());

        return ResponseEntity.ok(
                new AuthResponse(newAccessToken, user.getId().toString(), user.getEmail(), user.getDisplayName(), user.getUsername()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        logger.debug("Logout request received");

        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (REFRESH_COOKIE_NAME.equals(cookie.getName())) {
                    String rawToken = cookie.getValue();
                    refreshTokenService.invalidateToken(rawToken);
                    logger.info("Refresh token invalidated for cookie");

                    Cookie cleared = new Cookie(REFRESH_COOKIE_NAME, "");
                    cleared.setHttpOnly(true);
                    cleared.setSecure(false);
                    cleared.setPath("/api/auth");
                    cleared.setMaxAge(0);
                    response.addCookie(cleared);
                    logger.debug("Refresh cookie cleared");
                }
            }
        } else {
            logger.warn("Logout without cookies");
        }

        return ResponseEntity.ok().body("Logged out");
    }

    private void addRefreshCookie(HttpServletResponse response, String rawToken) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, rawToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);    // true in production
        cookie.setPath("/api/auth");
        cookie.setMaxAge(REFRESH_COOKIE_MAX_AGE);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
        logger.trace("Refresh cookie added to response");
    }
}