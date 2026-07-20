package com.chessy.chess_backend.controller.rest;

import com.chessy.chess_backend.dto.user.UserSearchResultDto;
import com.chessy.chess_backend.entity.User;
import com.chessy.chess_backend.repository.UserRepository;
import com.chessy.chess_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/search")
    public List<UserSearchResultDto> search(Authentication auth, @RequestParam String prefix) {
        UUID callerId = resolveUserId(auth);

        if (prefix == null || prefix.isBlank()) {
            return List.of();
        }

        return userRepository.findTop10ByUsernameStartingWithIgnoreCaseAndIdNot(prefix.trim(), callerId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private UserSearchResultDto toDto(User user) {
        return UserSearchResultDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .build();
    }

    private UUID resolveUserId(Authentication auth) {
        CustomUserDetails principal = (CustomUserDetails) auth.getPrincipal();
        return principal.getId();
    }
}