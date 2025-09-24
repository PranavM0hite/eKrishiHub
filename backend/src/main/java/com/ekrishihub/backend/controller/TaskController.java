// src/main/java/com/ekrishihub/backend/controller/TaskController.java
package com.ekrishihub.backend.controller;

import com.ekrishihub.backend.dto.TaskRequest;
import com.ekrishihub.backend.dto.TaskResponse;
import com.ekrishihub.backend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

  private final TaskService taskService;

  /** List tasks for the logged-in user */
  @GetMapping
  public ResponseEntity<List<TaskResponse>> myTasks(Principal principal) {
    return ResponseEntity.ok(taskService.listForUser(principal.getName()));
  }

  /** Get one task (useful for an Edit page) */
  @GetMapping("/{id}")
  public ResponseEntity<TaskResponse> getOne(Principal principal, @PathVariable Long id) {
    return ResponseEntity.ok(taskService.getOneForUser(principal.getName(), id));
  }

  /** Create a task for the logged-in user */
  @PostMapping
  public ResponseEntity<TaskResponse> create(Principal principal,
                                             @Valid @RequestBody TaskRequest req) {
    TaskResponse created = taskService.createForUser(principal.getName(), req);
    return ResponseEntity
        .created(URI.create("/api/tasks/" + created.getId()))
        .body(created);
  }

  /** Full/partial update (title/description/dueDate/status) */
  @PutMapping("/{id}")
  public ResponseEntity<TaskResponse> update(Principal principal,
                                             @PathVariable Long id,
                                             @Valid @RequestBody TaskRequest req) {
    return ResponseEntity.ok(taskService.updateForUser(principal.getName(), id, req));
  }

  /** Change only the status (expects JSON: { "status": "IN_PROGRESS" }) */
  @PutMapping("/{id}/status")
  public ResponseEntity<TaskResponse> updateStatus(Principal principal,
                                                   @PathVariable Long id,
                                                   @RequestBody StatusUpdate payload) {
    return ResponseEntity.ok(
        taskService.updateStatusForUser(principal.getName(), id, payload.status)
    );
  }

  /** Delete a task */
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(Principal principal, @PathVariable Long id) {
    taskService.deleteForUser(principal.getName(), id);
    return ResponseEntity.noContent().build();
  }

  /** Minimal DTO for status updates */
  public static class StatusUpdate {
    public String status; // PENDING | IN_PROGRESS | COMPLETED
  }
}
