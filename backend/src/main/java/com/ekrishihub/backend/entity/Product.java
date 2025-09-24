package com.ekrishihub.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Product name is required")
    @Size(min = 2, max = 100, message = "Product name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Category is required")
    @Size(min = 2, max = 50, message = "Category must be between 2 and 50 characters")
    private String category;

    /** Free-text details shown in UI */
    @Column(length = 500)
    private String description;

    /** Use DECIMAL for money, not double */
    @NotNull(message = "Price is required")
    @Positive
    private Double price;

    /** Rename stock -> quantity, keep existing DB column name */
    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    @Column(name = "stock")
    private Integer quantity;

    /** Farmer owner id; nullable for open products */
    @Positive(message = "Owner ID must be a positive number")
    @Column(nullable = true)
    private Long ownerId;
}
