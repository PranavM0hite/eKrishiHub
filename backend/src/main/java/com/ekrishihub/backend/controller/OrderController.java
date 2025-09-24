// src/main/java/com/ekrishihub/backend/controller/OrderController.java
package com.ekrishihub.backend.controller;

import com.ekrishihub.backend.dto.OrderRequest;
import com.ekrishihub.backend.dto.OrderResponse;
import com.ekrishihub.backend.dto.PaymentCreateRequest;
import com.ekrishihub.backend.dto.PaymentCreateResponse;
import com.ekrishihub.backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class OrderController {

  private final OrderService orderService;

  /* ============================ CUSTOMER ============================ */

  /** Create a new order for the logged-in customer. */
  @PostMapping("/customer/orders")
  public ResponseEntity<OrderResponse> placeOrderForCustomer(
      @Valid @RequestBody OrderRequest req,
      Authentication auth
  ) {
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    OrderResponse created = orderService.placeOrderForCustomerEmail(auth.getName(), req);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  /** List all orders for the logged-in customer. */
  @GetMapping("/customer/orders")
  public ResponseEntity<List<OrderResponse>> myOrders(Authentication auth) {
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(orderService.listOrdersForCustomerEmail(auth.getName()));
  }

  /**
   * Partially edit an order (quantity and/or address).
   * Only the owner can edit, and only when NOT PAID.
   * Use PATCH so fields are optional.
   */
  @PatchMapping(
      value = "/customer/orders/{orderId}",
      consumes = "application/json",
      produces = "application/json"
  )
  public ResponseEntity<OrderResponse> updateOrderForCustomer(
      @PathVariable Long orderId,
      @RequestBody OrderRequest req, // quantity/address are optional here
      Authentication auth
  ) {
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(orderService.updateOrderForCustomer(orderId, req, auth));
  }

  /** Delete an order. Only owner, and only if NOT PAID. */
  @DeleteMapping("/customer/orders/{orderId}")
  public ResponseEntity<Void> deleteOrderForCustomer(
      @PathVariable Long orderId,
      Authentication auth
  ) {
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    orderService.deleteOrderForCustomer(orderId, auth);
    return ResponseEntity.noContent().build();
  }

  /* ============================= FARMER ============================= */

  /** List orders for products owned by the logged-in farmer. */
  @GetMapping("/farmer/orders")
  public ResponseEntity<List<OrderResponse>> farmerOrders(Authentication auth) {
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(orderService.listOrdersForFarmerEmail(auth.getName()));
  }

  /* ============================= PAYMENT ============================ */

  /** Create a Razorpay order for a single local order. */
  @PostMapping("/orders/payment/create")
  public ResponseEntity<PaymentCreateResponse> createPaymentOrder(
      @Valid @RequestBody PaymentCreateRequest req,
      Authentication auth
  ) {
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(orderService.createPaymentForOrder(req, auth));
  }

  /** Update payment status for a single order (optional/manual). */
  @PostMapping("/orders/payment/update")
  public ResponseEntity<String> updatePaymentStatus(
      @RequestParam Long orderId,
      @RequestParam String paymentId,
      @RequestParam String status
  ) {
    orderService.updatePaymentStatus(orderId, paymentId, status);
    return ResponseEntity.ok("Payment status updated");
  }

  /* -------- Bundle (one Pay Now for multiple orders) -------- */

  /** Create one Razorpay order for multiple local orders (sum total). */
  @PostMapping("/orders/payment/create-bundle")
  public ResponseEntity<PaymentCreateResponse> createPaymentOrderBundle(
      @Valid @RequestBody PaymentCreateRequest req, Authentication auth) {
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(orderService.createPaymentForOrders(req, auth));
  }

  /** Update payment status for multiple orders at once. */
  @PostMapping("/orders/payment/update-bundle")
  public ResponseEntity<Void> updatePaymentStatusBundle(
      @Valid @RequestBody PaymentCreateRequest req, Authentication auth) {
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    orderService.updatePaymentStatusForOrders(req, auth);
    return ResponseEntity.noContent().build();
  }
}
