package com.ekrishihub.backend.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AuthRequest {
	private String name;
    private String email;
    private String password;
    private String captchaToken;
    private String captchaAnswer;
    private String role; // optional for register
}
