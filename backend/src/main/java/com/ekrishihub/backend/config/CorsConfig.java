package com.ekrishihub.backend.config;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();

    // ⚠️ Use exact origins when allowCredentials = true
    cfg.setAllowedOrigins(List.of(
        "http://localhost:5173",
        "http://127.0.0.1:5173"
        // add "https://localhost:5173" if you ever run https locally
    ));

    // Allow all typical methods (or use List.of("*"))
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

    // Be generous with headers; avoids random preflight failures
    cfg.setAllowedHeaders(List.of("*"));

    // Expose anything you return (e.g., Authorization, Location)
    cfg.setExposedHeaders(List.of("Authorization", "Location"));

    // You are using cookies/Authorization from the browser
    cfg.setAllowCredentials(true);

    // Cache preflight for 1 hour
    cfg.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    // Restrict to your API paths (recommended)
    source.registerCorsConfiguration("/api/**", cfg);
    return source;
  }
}
