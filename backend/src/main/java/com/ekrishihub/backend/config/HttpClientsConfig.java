package com.ekrishihub.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class HttpClientsConfig {
  @Bean
  public RestTemplate restTemplate() {
    return new RestTemplate();
  }
}
