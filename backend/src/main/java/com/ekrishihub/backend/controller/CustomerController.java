package com.ekrishihub.backend.controller;

import com.ekrishihub.backend.dto.CustomerProfileResponse;
import com.ekrishihub.backend.service.CustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    // GET /api/customer/profile
    @GetMapping("/customer/profile")
    public ResponseEntity<CustomerProfileResponse> getProfile(Principal principal) {
        String email = principal.getName();  // email from JWT principal
        return ResponseEntity.ok(customerService.getCustomerProfileByEmail(email));
    }
}
