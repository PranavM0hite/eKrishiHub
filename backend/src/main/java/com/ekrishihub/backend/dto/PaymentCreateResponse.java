package com.ekrishihub.backend.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentCreateResponse {
  private Long orderId;          // your local order id
  private String razorpayOrderId;
  private Double amount;     // in rupees for display
  private String currency;       // "INR"
  private String key;            // your Razorpay key_id for Checkout
  private String productName;    // optional, for UI
}
