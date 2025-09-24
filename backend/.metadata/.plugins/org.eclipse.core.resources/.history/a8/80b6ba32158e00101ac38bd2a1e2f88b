package com.ekrishihub.backend.config;

import com.ekrishihub.backend.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.nio.charset.StandardCharsets;

@Configuration
public class SecurityConfig {

    @Autowired private JwtAuthFilter jwtAuthFilter;
    @Autowired private CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Stateless API
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Consistent JSON for 401/403
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, authEx) -> {
                    res.setStatus(401);
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    res.setCharacterEncoding(StandardCharsets.UTF_8.name());
                    res.getWriter().write("{\"message\":\"Unauthorized\"}");
                })
                .accessDeniedHandler((req, res, accessEx) -> {
                    res.setStatus(403);
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    res.setCharacterEncoding(StandardCharsets.UTF_8.name());
                    res.getWriter().write("{\"message\":\"Forbidden\"}");
                })
            )

            .authorizeHttpRequests(auth -> auth
                // Always allow CORS preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Public docs/health
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/actuator/**"
                ).permitAll()

                // ===== Auth & Registration (PUBLIC) =====
                // Keep your existing routes, plus OTP endpoints under /api/auth/**
                .requestMatchers(
                    "/api/auth/**",            // e.g. /api/auth/register, /api/auth/verify-otp, /api/auth/resend-otp, /api/auth/login
                    "/api/farmer-register",
                    "/api/customer-register",
                    "/api/farmer-login",
                    "/api/customer-login"
                ).permitAll()

                // Public endpoints (if desired)
                .requestMatchers("/api/weather/**").permitAll()
                // e.g. if you have public product listing:
                // .requestMatchers("/api/products/public/**").permitAll()

                // ===== Protected business routes (JWT required) =====
                .requestMatchers(
                    "/api/farmer/**",
                    "/api/tasks/**"
                    // add other protected prefixes here: "/api/orders/**", "/api/products/**" (non-public)
                ).authenticated()

                // Everything else requires auth
                .anyRequest().authenticated()
            )

            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(userDetailsService);
        p.setPasswordEncoder(passwordEncoder()); // must match encoder used at registration
        return p;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // cost=10 is a good balance; keep it consistent across the app
        return new BCryptPasswordEncoder(10);
    }
}
