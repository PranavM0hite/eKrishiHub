package com.ekrishihub.backend.dto;



import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductResponse {
	  private Long id;
	  private String name;
	  private String description;
	  private String category;
	  private Double price;
	  private Integer quantity;
	  private Long ownerId;
}
