package com.ekrishihub.backend.service;

import com.ekrishihub.backend.entity.EmailOtp;
import com.ekrishihub.backend.repository.EmailOtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*; import java.util.concurrent.ThreadLocalRandom;

@Service @RequiredArgsConstructor
public class OtpService {
  private final EmailOtpRepository otpRepo;
  private final MailService mailService;
  private final PasswordEncoder bcrypt;

  @Value("${app.otp.length}") private int otpLen;
  @Value("${app.otp.ttl-minutes}") private int ttlMinutes;
  @Value("${app.otp.resend-cooldown-seconds}") private int resendCooldown;
  @Value("${app.otp.max-attempts}") private int maxAttempts;

  @Transactional
  public void sendOtp(String emailLower) {
    var now = LocalDateTime.now();
    var rec = otpRepo.findByEmailIgnoreCase(emailLower).orElse(null);

    if (rec != null && Duration.between(rec.getLastSentAt(), now).getSeconds() < resendCooldown) return;

    String otp = gen(otpLen);
    String hash = bcrypt.encode(otp);

    if (rec == null) rec = new EmailOtp();
    rec.setEmail(emailLower);
    rec.setOtpHash(hash);
    rec.setExpiresAt(now.plusMinutes(ttlMinutes));
    rec.setAttempts(0);
    rec.setLastSentAt(now);
    otpRepo.save(rec);

    mailService.sendOtpEmail(emailLower, otp, ttlMinutes);
  }

  @Transactional
  public boolean verify(String emailLower, String inputOtp) {
    var rec = otpRepo.findByEmailIgnoreCase(emailLower).orElse(null);
    if (rec == null) return false;
    if (rec.getExpiresAt().isBefore(LocalDateTime.now())) { otpRepo.deleteByEmailIgnoreCase(emailLower); return false; }
    if (rec.getAttempts() >= maxAttempts) { otpRepo.deleteByEmailIgnoreCase(emailLower); return false; }

    boolean ok = bcrypt.matches(inputOtp, rec.getOtpHash());
    if (ok) { otpRepo.deleteByEmailIgnoreCase(emailLower); return true; }
    rec.setAttempts(rec.getAttempts() + 1); otpRepo.save(rec); return false;
  }

  private String gen(int n){ var r=ThreadLocalRandom.current(); var sb=new StringBuilder(n);
    for(int i=0;i<n;i++) sb.append(r.nextInt(10)); return sb.toString(); }
}
