package com.chessy.chess_backend.service;

import com.chessy.chess_backend.entity.User;
import com.chessy.chess_backend.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        // 1. Call Google to get user info (standard behaviour)
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String googleId = (String) attributes.get("sub");
        String email = (String) attributes.get("email");
        String displayName = (String) attributes.get("name");

        // 2. Find or create our internal User record
        User user = userRepository.findByGoogleId(googleId)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .map(existing -> {
                            // Link Google ID to existing local account
                            existing.setGoogleId(googleId);
                            return userRepository.save(existing);
                        })
                        .orElseGet(() -> createNewUser(email, displayName, googleId))
                );

        // 3. Return a Spring Security user that holds the Google attributes
        return new DefaultOAuth2User(
                oAuth2User.getAuthorities(),
                oAuth2User.getAttributes(),
                "sub"  // name attribute key
        );
    }

    private User createNewUser(String email, String displayName, String googleId) {
        // Generate a unique username from email prefix (e.g. "alice" from "alice@gmail.com")
        String baseUsername = email.substring(0, email.indexOf('@'))
                .replaceAll("[^a-zA-Z0-9_]", "_");
        String username = baseUsername;
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + "_" + suffix++;
        }

        User user = User.builder()
                .email(email)
                .displayName(displayName != null ? displayName : username)
                .username(username)
                .googleId(googleId)
                .build();
        return userRepository.save(user);
    }
}