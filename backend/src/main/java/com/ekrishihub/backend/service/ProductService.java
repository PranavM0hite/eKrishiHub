// src/main/java/com/ekrishihub/backend/service/ProductService.java
package com.ekrishihub.backend.service;

import com.ekrishihub.backend.dto.ProductRequest;
import com.ekrishihub.backend.dto.ProductResponse;
import com.ekrishihub.backend.entity.AppUser;
import com.ekrishihub.backend.entity.Product;
import com.ekrishihub.backend.repository.ProductRepository;
import com.ekrishihub.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

  @Autowired private ProductRepository productRepository;
  @Autowired private UserRepository userRepository;

  /* ----------------------------- CREATE ----------------------------- */

  /** Public/compat create (ownerId may be null). */
  public ProductResponse addProduct(Long ownerId, ProductRequest req) {
    validateForCreate(req);
    Product p = new Product();
    p.setName(req.getName().trim());
    p.setCategory(req.getCategory().trim());
    p.setPrice(req.getPrice());
    p.setQuantity(req.getQuantity());
    p.setDescription(normalizeDescription(req.getDescription()));   // ✅ persist
    p.setOwnerId(ownerId);
    return mapSafe(productRepository.save(p));
  }

  /** Create for the currently authenticated farmer (email -> ownerId). */
  public ProductResponse addProductForOwnerEmail(String email, ProductRequest req) {
    validateForCreate(req);
    Long ownerId = resolveOwnerIdByEmail(email);
    Product p = new Product();
    p.setName(req.getName().trim());
    p.setCategory(req.getCategory().trim());
    p.setPrice(req.getPrice());
    p.setQuantity(req.getQuantity());
    p.setDescription(normalizeDescription(req.getDescription()));   // ✅ persist
    p.setOwnerId(ownerId);
    return mapSafe(productRepository.save(p));
  }

  /* ------------------------------ READ ------------------------------ */

  public List<ProductResponse> getAll() {
    return productRepository.findAll().stream().map(this::mapSafe).collect(Collectors.toList());
  }

  public List<ProductResponse> getByOwnerEmail(String email) {
    Long ownerId = resolveOwnerIdByEmail(email);
    return productRepository.findByOwnerId(ownerId).stream().map(this::mapSafe).collect(Collectors.toList());
  }

  public ProductResponse getOneForOwnerEmail(String email, Long id) {
    Long ownerId = resolveOwnerIdByEmail(email);
    Product p = productRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    if (p.getOwnerId() == null || !ownerId.equals(p.getOwnerId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your product");
    }
    return mapSafe(p);
  }

  /* ----------------------------- UPDATE ----------------------------- */

  /** Partial update for an owned product. Only provided fields are updated. */
  public ProductResponse updateForOwnerEmail(String email, Long id, ProductRequest req) {
    Long ownerId = resolveOwnerIdByEmail(email);
    Product p = productRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    if (p.getOwnerId() == null || !ownerId.equals(p.getOwnerId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your product");
    }

    if (req.getName() != null) {
      String n = req.getName().trim();
      if (n.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
      p.setName(n);
    }
    if (req.getCategory() != null) {
      String c = req.getCategory().trim();
      if (c.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category is required");
      p.setCategory(c);
    }
    if (req.getPrice() != null) {
      if (req.getPrice() <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must be greater than 0");
      p.setPrice(req.getPrice());
    }
    if (req.getQuantity() != null) {
      if (req.getQuantity() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity cannot be negative");
      p.setQuantity(req.getQuantity());
    }
    if (req.getDescription() != null) {                               // ✅ update
      String d = normalizeDescription(req.getDescription());
      if (d.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description is required");
      p.setDescription(d);
    }

    return mapSafe(productRepository.save(p));
  }

  /* ----------------------------- DELETE ----------------------------- */

  public void deleteForOwnerEmail(String email, Long id) {
    Long ownerId = resolveOwnerIdByEmail(email);
    Product p = productRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    if (p.getOwnerId() == null || !ownerId.equals(p.getOwnerId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your product");
    }
    productRepository.deleteById(id);
  }

  /* ----------------------------- HELPERS ---------------------------- */

  private void validateForCreate(ProductRequest req) {
    if (req == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Body is required");
    if (req.getName() == null || req.getName().trim().isEmpty())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
    if (req.getCategory() == null || req.getCategory().trim().isEmpty())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category is required");
    if (req.getPrice() == null || req.getPrice() <= 0)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must be greater than 0");
    if (req.getQuantity() == null || req.getQuantity() < 0)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity cannot be negative");
    if (req.getDescription() == null || req.getDescription().trim().isEmpty()) // ✅ align with UI
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description is required");
  }

  private String normalizeDescription(String d) {
    return d == null ? "" : d.trim();
  }

  private Long resolveOwnerIdByEmail(String email) {
    if (email == null || email.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    return userRepository.findByEmailIgnoreCase(email)
        .map(AppUser::getId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  /** Include description so the UI can render it. */
  private ProductResponse mapSafe(Product p) {
    if (p == null) p = new Product();
    ProductResponse dto = new ProductResponse();
    dto.setId(p.getId());
    dto.setName(p.getName() != null ? p.getName() : "Unnamed");
    dto.setCategory(p.getCategory() != null ? p.getCategory() : "General");
    dto.setPrice(p.getPrice() != null ? p.getPrice() : 0.0);
    dto.setQuantity(p.getQuantity() != null ? p.getQuantity() : 0);
    dto.setDescription(p.getDescription() != null ? p.getDescription() : ""); // ✅ return it
    dto.setOwnerId(p.getOwnerId());
    return dto;
  }
}
