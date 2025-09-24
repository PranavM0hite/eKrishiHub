package com.ekrishihub.backend.controller;

import com.ekrishihub.backend.dto.AuthRequest;
import com.ekrishihub.backend.dto.AuthResponse;
import com.ekrishihub.backend.entity.AppUser;
import com.ekrishihub.backend.repository.UserRepository;
import com.ekrishihub.backend.service.AuthService;
import com.ekrishihub.backend.service.OtpService;
import com.ekrishihub.backend.service.TurnstileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    private final AuthService authService;
    private final TurnstileService turnstile;
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final OtpService otpService;

    public AuthController(
            AuthService authService,
            TurnstileService turnstile,
            UserRepository userRepo,
            PasswordEncoder encoder,
            OtpService otpService
    ) {
        this.authService = authService;
        this.turnstile = turnstile;
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.otpService = otpService;
    }

    /* ===========================================================
       (Legacy) REGISTER WITHOUT OTP — keep if current UI uses it
       =========================================================== */

    @PostMapping(value = "/farmer-register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponse> registerFarmer(@Valid @RequestBody AuthRequest req) {
        return ResponseEntity.status(201).body(authService.registerWithRole(req, "FARMER"));
    }

    @PostMapping(value = "/customer-register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponse> registerCustomer(@Valid @RequestBody AuthRequest req) {
        return ResponseEntity.status(201).body(authService.registerWithRole(req, "CUSTOMER"));
    }

    /* ===========================================================
       LOGIN (JSON or FORM) — with Turnstile
       =========================================================== */

    @PostMapping(
        value = "/farmer-login",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<AuthResponse> loginFarmerJson(
        @RequestBody AuthRequest body,
        @RequestHeader(value = "X-Turnstile-Token", required = false) String tsToken,
        HttpServletRequest request
    ) {
        verifyTurnstileOrThrow(tsToken, request);
        AuthRequest normalized = normalizeBody(body, null);
        return ResponseEntity.ok(authService.login(normalized));
    }

    @PostMapping(
        value = "/farmer-login",
        consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<AuthResponse> loginFarmerForm(
        @RequestParam MultiValueMap<String, String> form,
        @RequestHeader(value = "X-Turnstile-Token", required = false) String tsToken,
        HttpServletRequest request
    ) {
        verifyTurnstileOrThrow(tsToken, request);
        AuthRequest normalized = normalizeBody(null, form);
        return ResponseEntity.ok(authService.login(normalized));
    }

    @PostMapping(
        value = "/customer-login",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<AuthResponse> loginCustomerJson(
        @RequestBody AuthRequest body,
        @RequestHeader(value = "X-Turnstile-Token", required = false) String tsToken,
        HttpServletRequest request
    ) {
        verifyTurnstileOrThrow(tsToken, request);
        AuthRequest normalized = normalizeBody(body, null);
        return ResponseEntity.ok(authService.login(normalized));
    }

    @PostMapping(
        value = "/customer-login",
        consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<AuthResponse> loginCustomerForm(
        @RequestParam MultiValueMap<String, String> form,
        @RequestHeader(value = "X-Turnstile-Token", required = false) String tsToken,
        HttpServletRequest request
    ) {
        verifyTurnstileOrThrow(tsToken, request);
        AuthRequest normalized = normalizeBody(null, form);
        return ResponseEntity.ok(authService.login(normalized));
    }

    /* ===========================================================
       ✅ NEW: EMAIL OTP FLOW (JSON only)
       =========================================================== */

    public record RegisterRequest(
            @NotBlank String name,
            @Email @NotBlank String email,
            @NotBlank @Size(min = 6) String password,
            @NotBlank @Pattern(regexp = "FARMER|CUSTOMER|ADMIN") String role
    ) {}
    public record OtpVerifyRequest(
            @Email @NotBlank String email,
            @NotBlank String otp
    ) {}

    // Create disabled user + send OTP (generic response; don’t leak existence)
    @PostMapping(value = "/auth/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> otpRegister(@Valid @RequestBody RegisterRequest req) {
        String email = safeLower(req.email());
        Optional<AppUser> existing = userRepo.findByEmailIgnoreCase(email);

        if (existing.isEmpty()) {
            AppUser u = new AppUser();
            u.setEmail(email);
            u.setName(req.name().trim());
            u.setPassword(encoder.encode(req.password()));
            u.setRole(req.role().toUpperCase());    // ← String role, no enum
            u.setEnabled(false);
            u.setEmailVerified(false);
            userRepo.save(u);
        }

        otpService.sendOtp(email); // handles resend cooldown internally
        return ResponseEntity.ok(Map.of("message", "If the email is valid, an OTP has been sent."));
    }

    // Verify OTP → activate user
    @PostMapping(value = "/auth/verify-otp", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> otpVerify(@Valid @RequestBody OtpVerifyRequest req) {
        String email = safeLower(req.email());
        boolean ok = otpService.verify(email, req.otp());
        if (!ok) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
        }
        int updated = userRepo.activateByEmail(email);
        if (updated == 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        return ResponseEntity.ok(Map.of("message", "Email verified. You can now log in."));
    }

    // Resend OTP (generic response)
    @PostMapping(value = "/auth/resend-otp", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> otpResend(@RequestBody Map<String,String> body) {
        String email = safeLower(body.getOrDefault("email", ""));
        if (email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error","Email required"));
        }
        otpService.sendOtp(email);
        return ResponseEntity.ok(Map.of("message", "If the email is valid, a new OTP has been sent."));
    }

    /* ============================ Helpers ============================ */

    private void verifyTurnstileOrThrow(String token, HttpServletRequest req) {
        boolean ok = turnstile.verify(token, req != null ? req.getRemoteAddr() : null);
        if (!ok) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Turnstile verification failed");
    }

    private AuthRequest normalizeBody(AuthRequest body, MultiValueMap<String, String> form) {
        AuthRequest req = new AuthRequest();
        if (body != null) {
            String principal = firstNonBlank(body.getName(), body.getEmail());
            req.setEmail(safeLower(principal));
            req.setPassword(body.getPassword());
            return req;
        }
        String username = getFirst(form, "username");
        String email    = getFirst(form, "email");
        String principal = firstNonBlank(username, email);
        req.setEmail(safeLower(principal));
        req.setPassword(getFirst(form, "password"));
        return req;
    }

    private String getFirst(MultiValueMap<String, String> form, String key) {
        return form != null && form.getFirst(key) != null ? form.getFirst(key).trim() : null;
    }
    private String safeLower(String s) { return s == null ? null : s.trim().toLowerCase(); }
    private String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        if (b != null && !b.isBlank()) return b;
        return null;
    }
}
