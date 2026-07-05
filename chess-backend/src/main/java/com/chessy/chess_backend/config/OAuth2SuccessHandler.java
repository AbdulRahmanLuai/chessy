package com.chessy.chess_backend.config;

import com.chessy.chess_backend.controller.rest.AuthController;
import com.chessy.chess_backend.entity.User;
import com.chessy.chess_backend.repository.UserRepository;
import com.chessy.chess_backend.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final String frontendRedirectUrl;

    public OAuth2SuccessHandler(
            RefreshTokenService refreshTokenService,
            UserRepository userRepository,
            @Value("${app.frontend-redirect-url}") String frontendRedirectUrl) {
        this.refreshTokenService = refreshTokenService;
        this.userRepository = userRepository;
        this.frontendRedirectUrl = frontendRedirectUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = (String) oAuth2User.getAttribute("email");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found after Google login"));

        // Only set the refresh token cookie (httpOnly). No access token in URL.
        String refreshTokenRaw = refreshTokenService.generateRefreshToken(user.getId());
        Cookie cookie = new Cookie(AuthController.REFRESH_COOKIE_NAME, refreshTokenRaw);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // set true with HTTPS
        cookie.setPath("/api/auth");
        cookie.setMaxAge(60 * 60 * 24 * 30);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);

        // Redirect to frontend without any token query param
        getRedirectStrategy().sendRedirect(request, response, frontendRedirectUrl);
    }
}