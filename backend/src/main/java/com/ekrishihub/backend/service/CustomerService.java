package com.ekrishihub.backend.service;

import com.ekrishihub.backend.dto.CustomerProfileResponse;
import com.ekrishihub.backend.entity.Customer;
import com.ekrishihub.backend.repository.CustomerRepository;
import org.springframework.stereotype.Service;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public CustomerProfileResponse getCustomerProfileByEmail(String email) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return new CustomerProfileResponse(
                customer.getName(),
                customer.getEmail(),
                customer.getAddress()
        );
    }
}
