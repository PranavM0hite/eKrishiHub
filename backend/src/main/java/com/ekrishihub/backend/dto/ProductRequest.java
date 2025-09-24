package com.ekrishihub.backend.dto;



import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductRequest {
	  private String name;
	  private String description;   // <-- exists
	  private String category;      // "FRUIT", "VEGETABLE", "GRAIN", "OTHER"
	  private Double price;     
	  private Integer quantity;
}
