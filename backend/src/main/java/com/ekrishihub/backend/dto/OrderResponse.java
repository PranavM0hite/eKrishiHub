package com.ekrishihub.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    private Long id;
    private Long productId;
    private Long farmerId;
    private Long customerId;
    private Integer quantity;
    private String address;
    private Double totalAmount;
    private String paymentStatus;
    private String orderStatus;

    // Extra info for frontend
    private String productName;
    private String productCategory;

    // Razorpay details
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;

    // 🕒 Timestamp
    private LocalDateTime createdAt;
}
