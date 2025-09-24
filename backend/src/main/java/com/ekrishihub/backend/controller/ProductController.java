// src/main/java/com/ekrishihub/backend/controller/ProductController.java
package com.ekrishihub.backend.controller;

import com.ekrishihub.backend.dto.ProductRequest;
import com.ekrishihub.backend.dto.ProductResponse;
import com.ekrishihub.backend.entity.Product;
import com.ekrishihub.backend.repository.ProductRepository;
import com.ekrishihub.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

  private final ProductService productService;
  private final ProductRepository productRepository;

  /* -------------------- Public list: GET /api/products -------------------- */
  @GetMapping("/products")
  public ResponseEntity<List<ProductResponse>> getAll() {
    return ResponseEntity.ok(productService.getAll());
  }

  /* --------------- Farmer list (mine): GET /api/farmer/products ----------- */
  @GetMapping("/farmer/products")
  public ResponseEntity<?> getMyProducts(Authentication auth) {
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
    }
    String email = auth.getName();
    return ResponseEntity.ok(productService.getByOwnerEmail(email));
  }

  /* ---------------------- Search: GET /api/products/search ----------------- */
  @GetMapping("/products/search")
  public ResponseEntity<List<Product>> searchProducts(
      @RequestParam(required = false) String name,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) Double minPrice,
      @RequestParam(required = false) Double maxPrice
  ) {
    return ResponseEntity.ok(productRepository.searchProducts(name, category, minPrice, maxPrice));
  }

  /* ---------------- Create (mine): POST /api/farmer/products -------------- */
  @PostMapping("/farmer/products")
  public ResponseEntity<?> addMyProduct(@RequestBody ProductRequest req, Authentication auth) {
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
    }
    String email = auth.getName();
    return ResponseEntity.ok(productService.addProductForOwnerEmail(email, req));
  }

  /* ----------- (Optional) Public create: POST /api/products --------------- */
  @PostMapping("/products")
  public ResponseEntity<ProductResponse> addProductOpen(@RequestBody ProductRequest req) {
    return ResponseEntity.ok(productService.addProduct(null, req));
  }

  /* ========================= NEW: CRUD like Tasks ========================= */

  // Get one of *my* products
  // GET /api/farmer/products/{id}
  @GetMapping("/farmer/products/{id}")
  public ResponseEntity<?> getMyProductById(@PathVariable Long id, Authentication auth) {
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
    }
    String email = auth.getName();
    ProductResponse resp = productService.getOneForOwnerEmail(email, id);
    return ResponseEntity.ok(resp);
  }

  // Update one of *my* products
  // PUT /api/farmer/products/{id}
  @PutMapping("/farmer/products/{id}")
  public ResponseEntity<?> updateMyProduct(@PathVariable Long id,
                                           @RequestBody ProductRequest req,
                                           Authentication auth) {
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
    }
    String email = auth.getName();
    ProductResponse resp = productService.updateForOwnerEmail(email, id, req);
    return ResponseEntity.ok(resp);
  }

  // Delete one of *my* products
  // DELETE /api/farmer/products/{id}
  @DeleteMapping("/farmer/products/{id}")
  public ResponseEntity<?> deleteMyProduct(@PathVariable Long id, Authentication auth) {
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
    }
    String email = auth.getName();
    productService.deleteForOwnerEmail(email, id);
    return ResponseEntity.noContent().build();
  }
}
