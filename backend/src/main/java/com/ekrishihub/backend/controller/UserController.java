package com.ekrishihub.backend.controller;

import com.ekrishihub.backend.entity.AppUser;
import com.ekrishihub.backend.repository.UserRepository;
import com.ekrishihub.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    // GET profile of logged-in user
    @GetMapping("/me")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        String email = authentication.getName();
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    // UPDATE profile
    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(Authentication authentication,
                                           @RequestBody AppUser updatedUser) {
        String email = authentication.getName();
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(updatedUser.getName());
        user.setEmail(updatedUser.getEmail());
        userRepository.save(user);

        return ResponseEntity.ok("Profile updated successfully");
    }
}
