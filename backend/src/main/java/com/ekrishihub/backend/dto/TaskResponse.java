package com.ekrishihub.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor          // <-- fixes “constructor undefined”
@AllArgsConstructor
@Builder
public class TaskResponse {
  private Long id;
  private String title;
  private String description;
  private String dueDate;   // yyyy-MM-dd string
  private String status;    // enum name as string
}
