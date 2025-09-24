package com.ekrishihub.backend.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentCreateRequest {
  private Long orderId;            // single
  private List<Long> orderIds;     // bundle
  private Double amount;           // optional
  private String status;           // for update
  private String paymentId;        // for update
}
