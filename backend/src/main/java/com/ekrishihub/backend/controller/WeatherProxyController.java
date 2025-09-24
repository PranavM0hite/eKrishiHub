package com.ekrishihub.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.stereotype.*;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weather")
public class WeatherProxyController {

  @Value("${openweather.api.key}")
  private String apiKey;

  private final RestTemplate restTemplate;

  public WeatherProxyController(RestTemplate restTemplate) {
    this.restTemplate = restTemplate;
  }

  @GetMapping
  public ResponseEntity<String> byCity(@RequestParam("q") String q,
                                       @RequestParam(value = "units", defaultValue = "metric") String units) {
    String url = "https://api.openweathermap.org/data/2.5/weather?q={q}&appid={key}&units={units}";
    String body = restTemplate.getForObject(url, String.class, q, apiKey, units);
    return ResponseEntity.ok(body);
  }
}
