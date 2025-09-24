// src/main/java/com/ekrishihub/backend/entity/Order.java
package com.ekrishihub.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "orders")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /* ---- Who is buying ---- */
    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    /* ---- What is being bought ---- */
    @Column(name = "product_id", nullable = false)
    private Long productId;

    /* ---- (Optional) which farmer owns the product ---- */
    @Column(name = "farmer_id")
    private Long farmerId;

    /* ---- Order details ---- */
    @Column(nullable = false)
    private Integer quantity;              // units/kg/etc.

    @Column(length = 512)
    private String address;                // delivery address

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    /* ---- Payment tracking ---- */
    @Column(name = "payment_status")
    private String paymentStatus;          // PENDING / PAID / FAILED

    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    @Column(name = "razorpay_signature")
    private String razorpaySignature;

    /* ---- Order lifecycle (optional) ---- */
    @Column(name = "order_status")
    private String orderStatus;            // CREATED / CONFIRMED / CANCELLED

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (paymentStatus == null) {
            paymentStatus = "PENDING";
        }
        if (orderStatus == null) {
            orderStatus = "CREATED";
        }
    }
}
