package com.ekrishihub.backend.repository;

import com.ekrishihub.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // For farmer-scoped queries
    List<Product> findByOwnerId(Long ownerId);

    // Text + price-range search (type-safe with BigDecimal)
    @Query("""
           SELECT p FROM Product p
           WHERE (:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')))
             AND (:category IS NULL OR LOWER(p.category) = LOWER(:category))
             AND (:minPrice IS NULL OR p.price >= :minPrice)
             AND (:maxPrice IS NULL OR p.price <= :maxPrice)
           """)
    List<Product> searchProducts(
            @Param("name") String name,
            @Param("category") String category,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice
    );
}
