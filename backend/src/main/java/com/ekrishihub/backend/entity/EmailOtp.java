package com.ekrishihub.backend.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import java.time.LocalDateTime;

@Entity @Table(name="email_otps")
@Getter @Setter
public class EmailOtp {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable=false, unique=true, length=120)
  private String email;                 // lowercased

  @Column(name="otp_hash", nullable=false, length=100)
  private String otpHash;               // bcrypt hash of OTP

  @Column(name="expires_at", nullable=false)
  private LocalDateTime expiresAt;

  @Column(nullable=false)
  private Integer attempts = 0;

  @Column(name="last_sent_at", nullable=false)
  private LocalDateTime lastSentAt;
}
