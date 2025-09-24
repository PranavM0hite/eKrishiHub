package com.ekrishihub.backend.service;

import com.ekrishihub.backend.dto.FarmerProfileResponse;
import com.ekrishihub.backend.entity.Farmer;
import com.ekrishihub.backend.repository.FarmerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class FarmerService {

    @Autowired private FarmerRepository farmerRepository;

    public FarmerProfileResponse getFarmerProfileByEmail(String email) {
        Farmer f = farmerRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Farmer not found"));
        return new FarmerProfileResponse(f.getId(), f.getName(), f.getEmail(), f.getLocation(), f.getPhone());
    }
    
    public Farmer addFarmer(Farmer farmer) {
        return farmerRepository.save(farmer);
    }
}
