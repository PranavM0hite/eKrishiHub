package com.ekrishihub.backend.service;

import com.ekrishihub.backend.dto.AuthRequest;
import com.ekrishihub.backend.dto.AuthResponse;
import com.ekrishihub.backend.entity.AppUser;
import com.ekrishihub.backend.repository.UserRepository;
import com.ekrishihub.backend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired private AuthenticationManager authManager;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    // === Generic (existing) ===
    public AuthResponse register(AuthRequest req) {
        if (userRepository.findByEmailIgnoreCase(req.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }
        String role = (req.getRole() == null ? "CUSTOMER" : req.getRole().toUpperCase());

        AppUser u = new AppUser();
        u.setEmail(req.getEmail());
        u.setPassword(passwordEncoder.encode(req.getPassword()));
        u.setRole(role);
        u.setName(req.getName());
        userRepository.save(u);

        String token = jwtUtil.generateToken(u.getEmail(), u.getRole());
        return new AuthResponse(token, u.getRole());
    }

    public AuthResponse login(AuthRequest req) {
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword());
        try {
            authManager.authenticate(authToken);
        } catch (BadCredentialsException ex) {
            throw new RuntimeException("Invalid credentials");
        }
        AppUser u = userRepository.findByEmailIgnoreCase(req.getEmail()).orElseThrow();
        String token = jwtUtil.generateToken(u.getEmail(), u.getRole());
        return new AuthResponse(token, u.getRole());
    }

    // === Role-specific (new) ===
    public AuthResponse registerWithRole(AuthRequest req, String forceRole) {
        if (userRepository.findByEmailIgnoreCase(req.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }
        String role = normalizeRole(forceRole);

        AppUser u = new AppUser();
        u.setEmail(req.getEmail());
        u.setPassword(passwordEncoder.encode(req.getPassword()));
        u.setRole(role);
        u.setName(req.getName());
        userRepository.save(u);

        String token = jwtUtil.generateToken(u.getEmail(), u.getRole());
        return new AuthResponse(token, u.getRole());
    }

    public AuthResponse loginWithRole(AuthRequest req, String expectedRole) {
        // authenticate credentials
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword());
        try {
            authManager.authenticate(authToken);
        } catch (BadCredentialsException ex) {
            throw new RuntimeException("Invalid credentials");
        }

        AppUser u = userRepository.findByEmailIgnoreCase(req.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // verify role matches
        String normalizedExpected = normalizeRole(expectedRole);
        if (!normalizedExpected.equalsIgnoreCase(u.getRole())) {
            throw new RuntimeException("Role mismatch");
        }

        String token = jwtUtil.generateToken(u.getEmail(), u.getRole());
        return new AuthResponse(token, u.getRole());
    }

    private String normalizeRole(String role) {
        if (role == null) return "CUSTOMER";
        role = role.trim().toUpperCase();
        // allow only the roles you use
        switch (role) {
            case "FARMER":
            case "CUSTOMER":
            case "ADMIN":
                return role;
            default:
                return "CUSTOMER";
        }
    }
}
