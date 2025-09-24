// src/main/java/com/ekrishihub/backend/service/OrderService.java
package com.ekrishihub.backend.service;

import com.ekrishihub.backend.dto.OrderRequest;
import com.ekrishihub.backend.dto.OrderResponse;
import com.ekrishihub.backend.dto.PaymentCreateRequest;
import com.ekrishihub.backend.dto.PaymentCreateResponse;
import com.ekrishihub.backend.entity.AppUser;
import com.ekrishihub.backend.entity.Order;
import com.ekrishihub.backend.entity.Product;
import com.ekrishihub.backend.repository.OrderRepository;
import com.ekrishihub.backend.repository.ProductRepository;
import com.ekrishihub.backend.repository.UserRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

  private final OrderRepository orderRepository;
  private final ProductRepository productRepository;
  private final UserRepository userRepository;

  @Value("${razorpay.key_id:}")
  private String razorpayKeyId;

  @Value("${razorpay.key_secret:}")
  private String razorpayKeySecret;

  /* ========================= CREATE (customer) ========================= */

  @Transactional
  public OrderResponse placeOrderForCustomerEmail(String customerEmail, OrderRequest req) {
    if (req == null) throw badRequest("Body is required");
    if (req.getProductId() == null) throw badRequest("productId is required");
    if (req.getQuantity() == null || req.getQuantity() <= 0) throw badRequest("quantity must be > 0");
    if (req.getAddress() == null || req.getAddress().isBlank()) throw badRequest("address is required");

    Long customerId = resolveUserIdByEmail(customerEmail);

    Product product = productRepository.findById(req.getProductId())
        .orElseThrow(() -> notFound("Product not found"));

    BigDecimal price = BigDecimal.valueOf(product.getPrice() != null ? product.getPrice() : 0.0);
    BigDecimal qty   = BigDecimal.valueOf(req.getQuantity());
    BigDecimal total = price.multiply(qty);

    Order o = new Order();
    o.setCustomerId(customerId);
    o.setProductId(product.getId());
    o.setQuantity(req.getQuantity());
    o.setAddress(req.getAddress().trim());
    o.setTotalAmount(total.doubleValue());
    o.setPaymentStatus("PENDING");
    o.setOrderStatus("CREATED");
    if (product.getOwnerId() != null) {
      o.setFarmerId(product.getOwnerId());
    }

    Order saved = orderRepository.save(o);
    return toResponse(saved, product);
  }

  /* ========================= READ ========================= */

  public List<OrderResponse> listOrdersForCustomerEmail(String customerEmail) {
    Long customerId = resolveUserIdByEmail(customerEmail);
    List<Order> orders = orderRepository.findByCustomerId(customerId);

    Set<Long> productIds = orders.stream().map(Order::getProductId).collect(Collectors.toSet());
    Map<Long, Product> productMap = productRepository.findAllById(productIds).stream()
        .collect(Collectors.toMap(Product::getId, p -> p));

    return orders.stream()
        .map(o -> toResponse(o, productMap.get(o.getProductId())))
        .collect(Collectors.toList());
  }

  public List<OrderResponse> listOrdersForFarmerEmail(String farmerEmail) {
    Long farmerId = resolveUserIdByEmail(farmerEmail);
    List<Product> myProducts = productRepository.findByOwnerId(farmerId);
    Set<Long> myProductIds = myProducts.stream().map(Product::getId).collect(Collectors.toSet());
    if (myProductIds.isEmpty()) return List.of();

    List<Order> orders = orderRepository.findByProductIdIn(myProductIds);
    Map<Long, Product> productMap = myProducts.stream()
        .collect(Collectors.toMap(Product::getId, p -> p));

    return orders.stream()
        .map(o -> toResponse(o, productMap.get(o.getProductId())))
        .collect(Collectors.toList());
  }

  /* ========================= UPDATE / DELETE (customer) ========================= */

  @Transactional
  public OrderResponse updateOrderForCustomer(Long orderId, OrderRequest req, Authentication auth) {
    Long userId = resolveUserIdByEmail(auth != null ? auth.getName() : null);

    Order o = orderRepository.findById(orderId)
        .orElseThrow(() -> notFound("Order not found"));

    if (!o.getCustomerId().equals(userId)) {
      throw unauthorized("Not your order");
    }
    if ("PAID".equalsIgnoreCase(String.valueOf(o.getPaymentStatus()))) {
      throw badRequest("Cannot edit a paid order");
    }

    boolean recompute = false;

    if (req != null && req.getQuantity() != null) {
      if (req.getQuantity() <= 0) throw badRequest("quantity must be > 0");
      o.setQuantity(req.getQuantity());
      recompute = true;
    }
    if (req != null && req.getAddress() != null && !req.getAddress().isBlank()) {
      o.setAddress(req.getAddress().trim());
    }

    if (recompute) {
      Product p = productRepository.findById(o.getProductId())
          .orElseThrow(() -> notFound("Product not found"));
      BigDecimal price = BigDecimal.valueOf(p.getPrice() != null ? p.getPrice() : 0.0);
      BigDecimal qty   = BigDecimal.valueOf(o.getQuantity());
      o.setTotalAmount(price.multiply(qty).doubleValue());
    }

    Order saved = orderRepository.save(o);
    Product p = productRepository.findById(o.getProductId()).orElse(null);
    return toResponse(saved, p);
  }

  @Transactional
  public void deleteOrderForCustomer(Long orderId, Authentication auth) {
    Long userId = resolveUserIdByEmail(auth != null ? auth.getName() : null);

    Order o = orderRepository.findById(orderId)
        .orElseThrow(() -> notFound("Order not found"));
    if (!o.getCustomerId().equals(userId)) {
      throw unauthorized("Not your order");
    }
    if ("PAID".equalsIgnoreCase(String.valueOf(o.getPaymentStatus()))) {
      throw badRequest("Cannot delete a paid order");
    }
    orderRepository.deleteById(orderId);
  }

  /* ========================= PAYMENT (single) ========================= */

  @Transactional
  public PaymentCreateResponse createPaymentForOrder(PaymentCreateRequest req, Authentication auth) {
    if (req == null || req.getOrderId() == null) throw badRequest("orderId is required");

    Long userId = resolveUserIdByEmail(auth != null ? auth.getName() : null);
    Order order = orderRepository.findById(req.getOrderId())
        .orElseThrow(() -> notFound("Order not found"));
    if (!order.getCustomerId().equals(userId)) {
      throw unauthorized("Not your order");
    }

    // If already has a Razorpay order and not FAILED -> reuse it
    if (order.getRazorpayOrderId() != null &&
        !"FAILED".equalsIgnoreCase(String.valueOf(order.getPaymentStatus()))) {
      return PaymentCreateResponse.builder()
          .orderId(order.getId())
          .razorpayOrderId(order.getRazorpayOrderId())
          .amount(order.getTotalAmount())
          .currency("INR")
          .key(razorpayKeyId)
          .build();
    }

    ensureGatewayConfigured();

    try {
      BigDecimal rupees = BigDecimal.valueOf(order.getTotalAmount());
      int paise = rupees.multiply(BigDecimal.valueOf(100))
                        .setScale(0, RoundingMode.HALF_UP)
                        .intValueExact();

      RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

      JSONObject orderRequest = new JSONObject();
      orderRequest.put("amount", paise);
      orderRequest.put("currency", "INR");
      orderRequest.put("receipt", "order_" + order.getId());

      com.razorpay.Order rpOrder = client.orders.create(orderRequest);
      String rpOrderId = rpOrder.get("id").toString();

      order.setRazorpayOrderId(rpOrderId);
      if (order.getPaymentStatus() == null || order.getPaymentStatus().isBlank()) {
        order.setPaymentStatus("PENDING");
      }
      orderRepository.save(order);

      return PaymentCreateResponse.builder()
          .orderId(order.getId())
          .razorpayOrderId(rpOrderId)
          .amount(order.getTotalAmount())
          .currency("INR")
          .key(razorpayKeyId)
          .build();
    } catch (RazorpayException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to create payment order", ex);
    }
  }

  @Transactional
  public void updatePaymentStatus(Long orderId, String paymentId, String status) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> notFound("Order not found"));

    if (paymentId != null && !paymentId.isBlank()) {
      order.setRazorpayPaymentId(paymentId);
    }
    String normalized = status == null ? "PENDING" : status.trim().toUpperCase();
    switch (normalized) {
      case "SUCCESS":
      case "PAID":
        order.setPaymentStatus("PAID");
        break;
      case "FAILED":
        order.setPaymentStatus("FAILED");
        break;
      default:
        order.setPaymentStatus(normalized);
    }
    orderRepository.save(order);
  }

  /* ========================= PAYMENT (bundle, optional) ========================= */

  @Transactional
  public PaymentCreateResponse createPaymentForOrders(PaymentCreateRequest req, Authentication auth) {
    if (req == null || req.getOrderIds() == null || req.getOrderIds().isEmpty()) {
      throw badRequest("orderIds are required");
    }
    Long userId = resolveUserIdByEmail(auth != null ? auth.getName() : null);

    List<Order> orders = orderRepository.findAllById(req.getOrderIds());
    if (orders.isEmpty()) throw notFound("Orders not found");

    // ensure all belong to this customer and are unpaid
    for (Order o : orders) {
      if (!o.getCustomerId().equals(userId)) {
        throw unauthorized("Includes order not owned by you: " + o.getId());
      }
      if ("PAID".equalsIgnoreCase(String.valueOf(o.getPaymentStatus()))) {
        throw badRequest("Order already paid: " + o.getId());
      }
    }

    double total = orders.stream().mapToDouble(Order::getTotalAmount).sum();

    ensureGatewayConfigured();

    try {
      BigDecimal rupees = BigDecimal.valueOf(total);
      int paise = rupees.multiply(BigDecimal.valueOf(100))
                        .setScale(0, RoundingMode.HALF_UP)
                        .intValueExact();

      RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

      JSONObject orderRequest = new JSONObject();
      orderRequest.put("amount", paise);
      orderRequest.put("currency", "INR");
      orderRequest.put("receipt", "bundle_" + userId + "_" + System.currentTimeMillis());

      com.razorpay.Order rpOrder = client.orders.create(orderRequest);
      String rpOrderId = rpOrder.get("id").toString();

      // store same rp order id on each local order
      for (Order o : orders) {
        o.setRazorpayOrderId(rpOrderId);
        if (o.getPaymentStatus() == null || o.getPaymentStatus().isBlank()) {
          o.setPaymentStatus("PENDING");
        }
      }
      orderRepository.saveAll(orders);

      return PaymentCreateResponse.builder()
          .orderId(null) // bundle: not a single local id
          .razorpayOrderId(rpOrderId)
          .amount(total)
          .currency("INR")
          .key(razorpayKeyId)
          .build();
    } catch (RazorpayException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to create payment order", ex);
    }
  }

  @Transactional
  public void updatePaymentStatusForOrders(PaymentCreateRequest req, Authentication auth) {
    if (req == null || req.getOrderIds() == null || req.getOrderIds().isEmpty()) {
      throw badRequest("orderIds are required");
    }
    Long userId = resolveUserIdByEmail(auth != null ? auth.getName() : null);

    List<Order> orders = orderRepository.findAllById(req.getOrderIds());
    if (orders.isEmpty()) throw notFound("Orders not found");

    String normalized = req.getStatus() == null ? "PENDING" : req.getStatus().trim().toUpperCase();

    for (Order o : orders) {
      if (!o.getCustomerId().equals(userId)) {
        throw unauthorized("Includes order not owned by you: " + o.getId());
      }
      if (req.getPaymentId() != null && !req.getPaymentId().isBlank()) {
        o.setRazorpayPaymentId(req.getPaymentId());
      }
      switch (normalized) {
        case "SUCCESS":
        case "PAID":
          o.setPaymentStatus("PAID");
          break;
        case "FAILED":
          o.setPaymentStatus("FAILED");
          break;
        default:
          o.setPaymentStatus(normalized);
      }
    }
    orderRepository.saveAll(orders);
  }

  /* ========================= Helpers ========================= */

  private void ensureGatewayConfigured() {
    if (razorpayKeyId == null || razorpayKeyId.isBlank()
        || razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Payment gateway not configured");
    }
  }

  private Long resolveUserIdByEmail(String email) {
    if (email == null || email.isBlank()) throw unauthorized("Unauthorized");
    return userRepository.findByEmailIgnoreCase(email)
        .map(AppUser::getId)
        .orElseThrow(() -> unauthorized("User not found"));
  }

  private OrderResponse toResponse(Order o, Product p) {
    String productName = (p != null && p.getName() != null) ? p.getName() : ("Product #" + o.getProductId());
    String category    = (p != null && p.getCategory() != null) ? p.getCategory() : "General";

    return OrderResponse.builder()
        .id(o.getId())
        .productId(o.getProductId())
        .productName(productName)
        .productCategory(category)
        .quantity(o.getQuantity())
        .totalAmount(o.getTotalAmount())
        .address(o.getAddress())
        .paymentStatus(o.getPaymentStatus())
        .razorpayOrderId(o.getRazorpayOrderId())
        .razorpayPaymentId(o.getRazorpayPaymentId())
        .createdAt(o.getCreatedAt())
        .build();
  }

  private ResponseStatusException badRequest(String msg) {
    return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
  }
  private ResponseStatusException notFound(String msg) {
    return new ResponseStatusException(HttpStatus.NOT_FOUND, msg);
  }
  private ResponseStatusException unauthorized(String msg) {
    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, msg);
  }
}
