package com.chessy.chess_backend.controller.rest;

import com.chessy.chess_backend.dto.AuthResponse;
import com.chessy.chess_backend.dto.LoginRequest;
import com.chessy.chess_backend.dto.RegisterRequest;
import com.chessy.chess_backend.entity.User;
import com.chessy.chess_backend.repository.UserRepository;
import com.chessy.chess_backend.service.RefreshTokenService;
import com.chessy.chess_backend.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
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

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    public static final String REFRESH_COOKIE_NAME = "rt";
    // Cookie max-age in seconds (30 days)
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
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body("Email already in use");
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            return ResponseEntity.badRequest().body("Username already in use");
        }

        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .displayName(req.getDisplayName())
                .username(req.getUsername())
                .build();


        userRepository.save(user);

        String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getUsername());
        String refreshTokenRaw = refreshTokenService.generateRefreshToken(user.getId());
        addRefreshCookie(response, refreshTokenRaw);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(accessToken, user.getId().toString(), user.getEmail(), user.getDisplayName(), user.getUsername()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req,
                                   HttpServletResponse response) {

        String login = req.getLogin().trim();
        User user;
        if (login.contains("@")) {
            user = userRepository.findByEmail(login).orElse(null);
        } else {
            user = userRepository.findByUsername(login).orElse(null);
        }

        if (user == null || user.getPasswordHash() == null ||
                !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
        String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getUsername());
        String refreshTokenRaw = refreshTokenService.generateRefreshToken(user.getId());
        addRefreshCookie(response, refreshTokenRaw);

        return ResponseEntity.ok(
                new AuthResponse(accessToken, user.getId().toString(), user.getEmail(), user.getDisplayName(), user.getUsername()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request,
                                     HttpServletResponse response) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No refresh token cookie");
        }

        Optional<String> rawToken = Arrays.stream(cookies)
                .filter(c -> REFRESH_COOKIE_NAME.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();

        if (rawToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing refresh token cookie");
        }

        RefreshTokenService.RefreshTokenResult result = refreshTokenService.validateAndRotate(rawToken.get());
        if (result == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired refresh token");
        }

        User user = userRepository.findById(result.userId()).orElseThrow();
        String newAccessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getUsername());
        addRefreshCookie(response, result.newRawToken());

        return ResponseEntity.ok(
                new AuthResponse(newAccessToken, user.getId().toString(), user.getEmail(), user.getDisplayName(), user.getUsername()));
    }

    private void addRefreshCookie(HttpServletResponse response, String rawToken) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, rawToken);
        cookie.setHttpOnly(true);   // JavaScript can't read it
        cookie.setSecure(false);    // set true in production with HTTPS
        cookie.setPath("/api/auth"); // only sent to /api/auth endpoints
        cookie.setMaxAge(REFRESH_COOKIE_MAX_AGE);
        // SameSite=Lax is fine; prevents CSRF for state-changing requests
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }
}