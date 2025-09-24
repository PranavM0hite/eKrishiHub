package com.ekrishihub.backend.repository;

import com.ekrishihub.backend.entity.AppUser;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {

    // Primary lookup (case-insensitive)
    Optional<AppUser> findByEmailIgnoreCase(String email);

    // Only enabled (post-OTP) users
    Optional<AppUser> findByEmailIgnoreCaseAndEnabledTrue(String email);

    // Existence checks
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndEnabledTrue(String email);

    // Lightweight projection when you only need the id
    @Query("select u.id from AppUser u where lower(u.email) = lower(?1)")
    Optional<Long> findIdByEmailIgnoreCase(String email);

    // Atomic activation: set both flags in one statement (used after OTP verify)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("""
           update AppUser u
              set u.enabled = true,
                  u.emailVerified = true
            where lower(u.email) = lower(:email)
           """)
    int activateByEmail(@Param("email") String email);

    // (Optional) Normalize stored emails to lowercase (data-fix utility)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("""
           update AppUser u
              set u.email = lower(u.email)
            where u.email <> lower(u.email)
           """)
    int normalizeAllEmailsToLowercase();
}
