package com.ekrishihub.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "app_users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    @Column(unique = true, nullable = false, length = 120)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    @Column(nullable = false, length = 100)
    private String password;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "FARMER|CUSTOMER|ADMIN",
             message = "Role must be FARMER, CUSTOMER, or ADMIN")
    @Column(nullable = false, length = 20)
    private String role;   // stored as upper-case string, e.g., "FARMER"

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    @Column(nullable = false, length = 50)
    private String name;

    // ===== Email OTP / Activation flags =====
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(nullable = false)
    private boolean enabled = false;

    // Normalize inputs (avoid case issues across the app)
    @PrePersist
    @PreUpdate
    private void normalize() {
        if (email != null) {
            email = email.trim().toLowerCase();
        }
        if (role != null) {
            role = role.trim().toUpperCase();
        }
        if (name != null) {
            name = name.trim();
        }
    }
}
