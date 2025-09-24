package com.ekrishihub.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class MailService {
  private final JavaMailSender mailSender;
  @Value("${app.mail.from}") private String from;

  public void sendOtpEmail(String to, String otp, int ttlMinutes) {
    SimpleMailMessage msg = new SimpleMailMessage();
    msg.setFrom(from);
    msg.setTo(to);
    msg.setSubject("Your e-KrishiHub verification code");
    msg.setText("""
        Hello,

        Your verification code is: %s
        It expires in %d minutes.

        If you did not request this, ignore this email.
        """.formatted(otp, ttlMinutes));
    mailSender.send(msg);
  }
}
