package com.ekrishihub.backend.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class FarmerProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String location;
    private String phone;
}
