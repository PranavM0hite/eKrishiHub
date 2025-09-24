package com.ekrishihub.backend.controller;

import com.ekrishihub.backend.dto.FarmerProfileResponse;
import com.ekrishihub.backend.service.FarmerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FarmerController {

    @Autowired
    private FarmerService farmerService;

    // GET /api/farmer/profile
    @GetMapping("/farmer/profile")
    public ResponseEntity<FarmerProfileResponse> getProfile(Principal principal) {
        String email = principal.getName(); // requires authenticated request
        return ResponseEntity.ok(farmerService.getFarmerProfileByEmail(email));
    }

}
