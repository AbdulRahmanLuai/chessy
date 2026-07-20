package com.chessy.chess_backend.controller.rest;

import com.chessy.chess_backend.PostgresTestBase;
import com.chessy.chess_backend.dto.auth.LoginRequest;
import com.chessy.chess_backend.entity.User;
import com.chessy.chess_backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
@Transactional  // rolls back DB changes after each test — container stays up
class RefreshTokenIntegrationTest extends PostgresTestBase {

    @Autowired MockMvc         mockMvc;
    @Autowired ObjectMapper    objectMapper;
    @Autowired UserRepository  userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String REFRESH_URL = "/api/auth/refresh";
    private static final String LOGIN_URL   = "/api/auth/login";
    private static final String COOKIE_NAME = AuthController.REFRESH_COOKIE_NAME;

    @BeforeEach
    void seedUser() {
        User user = User.builder()
                .email("test@chessy.com")
                .username("testuser")
                .displayName("Test User")
                .passwordHash(passwordEncoder.encode("password123"))
                .build();
        userRepository.save(user);
    }

    // ── Helper ─────────────────────────────────────────────────────────────

    private String loginAndGetCookie() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setLogin("testuser");
        req.setPassword("password123");

        MvcResult result = mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie cookie = result.getResponse().getCookie(COOKIE_NAME);
        assertThat(cookie).as("rt cookie must be present after login").isNotNull();
        return cookie.getValue();
    }

    // ── Tests ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Valid rt cookie → 200, new accessToken, rotated cookie")
    void refresh_withValidCookie_returnsNewTokens() throws Exception {
        String original = loginAndGetCookie();

        MvcResult result = mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie(COOKIE_NAME, original)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();

        Cookie rotated = result.getResponse().getCookie(COOKIE_NAME);
        assertThat(rotated).as("rotated cookie must be present").isNotNull();
        assertThat(rotated.getValue())
                .as("rotated value must differ from original")
                .isNotEqualTo(original);
    }

    @Test
    @DisplayName("No cookie → 401")
    void refresh_withNoCookie_returns401() throws Exception {
        mockMvc.perform(post(REFRESH_URL))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Wrong cookie name → 401")
    void refresh_withWrongCookieName_returns401() throws Exception {
        mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie("wrong_name", "somevalue")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Garbage cookie value → 401")
    void refresh_withInvalidToken_returns401() throws Exception {
        mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie(COOKIE_NAME, "not-a-real-token")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Replay attack — used token rejected on second call")
    void refresh_replayAttack_secondUseRejected() throws Exception {
        String token = loginAndGetCookie();

        // First use — valid
        mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie(COOKIE_NAME, token)))
                .andExpect(status().isOk());

        // Same token again — must be rejected
        mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie(COOKIE_NAME, token)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Logout invalidates token — refresh after logout returns 401")
    void refresh_afterLogout_returns401() throws Exception {
        String token = loginAndGetCookie();

        mockMvc.perform(post("/api/auth/logout")
                        .cookie(new Cookie(COOKIE_NAME, token)))
                .andExpect(status().isOk());

        mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie(COOKIE_NAME, token)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Chained refresh — rotated token is itself valid")
    void refresh_chainedRefresh_bothSucceed() throws Exception {
        String first = loginAndGetCookie();

        MvcResult firstResult = mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie(COOKIE_NAME, first)))
                .andExpect(status().isOk())
                .andReturn();

        String second = firstResult.getResponse().getCookie(COOKIE_NAME).getValue();

        mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie(COOKIE_NAME, second)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }
}