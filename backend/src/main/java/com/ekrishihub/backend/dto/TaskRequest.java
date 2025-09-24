package com.ekrishihub.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskRequest {
  private String title;
  private String description;
  /** expected format: yyyy-MM-dd (optional) */
  private String dueDate;
  /** optional; one of PENDING, IN_PROGRESS, COMPLETED */
  private String status;
}
