package com.ekrishihub.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class TurnstileService {

  @Value("${turnstile.secret}")
  private String secret;

  private final RestTemplate rt = new RestTemplate();

  public boolean verify(String token, String remoteIp) {
    if (token == null || token.isBlank()) return false;

    var body = new LinkedMultiValueMap<String, String>();
    body.add("secret", secret);
    body.add("response", token);
    if (remoteIp != null && !remoteIp.isBlank()) body.add("remoteip", remoteIp);

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

    ResponseEntity<Map> resp = rt.postForEntity(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        new HttpEntity<>(body, headers),
        Map.class
    );

    Object success = resp.getBody() == null ? null : resp.getBody().get("success");
    return Boolean.TRUE.equals(success);
  }
}
