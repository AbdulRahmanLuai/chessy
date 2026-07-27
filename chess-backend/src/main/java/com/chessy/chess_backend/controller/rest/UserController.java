package com.chessy.chess_backend.controller.rest;
import com.chessy.chess_backend.dto.user.UserProfileDto;
import com.chessy.chess_backend.dto.user.UserSearchResultDto;
import com.chessy.chess_backend.entity.User;
import com.chessy.chess_backend.repository.UserRepository;
import com.chessy.chess_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

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
                .map(this::toSearchDto)
                .toList();
    }

    @GetMapping("/{userName}")
    public UserProfileDto getProfile(@PathVariable String userName) {
        User user = userRepository.findByUsernameIgnoreCase(userName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return toProfileDto(user);
    }

    private UserSearchResultDto toSearchDto(User user) {
        return UserSearchResultDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .build();
    }

    private UserProfileDto toProfileDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private UUID resolveUserId(Authentication auth) {
        CustomUserDetails principal = (CustomUserDetails) auth.getPrincipal();
        return principal.getId();
    }
}