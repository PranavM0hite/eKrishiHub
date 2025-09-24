package com.ekrishihub.backend.service;

import com.ekrishihub.backend.dto.TaskRequest;
import com.ekrishihub.backend.dto.TaskResponse;
import com.ekrishihub.backend.entity.AppUser;
import com.ekrishihub.backend.entity.Task;
import com.ekrishihub.backend.entity.TaskStatus;
import com.ekrishihub.backend.repository.TaskRepository;
import com.ekrishihub.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class TaskService {

  private final TaskRepository taskRepo;
  private final UserRepository userRepo;

  private static final Set<String> ALLOWED = Set.of("PENDING", "IN_PROGRESS", "COMPLETED");

  public TaskService(TaskRepository taskRepo, UserRepository userRepo) {
    this.taskRepo = taskRepo;
    this.userRepo = userRepo;
  }

  /* ----------------------------- Create ----------------------------- */

  public TaskResponse createForUser(String email, TaskRequest req) {
    Long ownerId = findOwnerIdOr401(email);

    if (req == null || req.getTitle() == null || req.getTitle().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
    }

    LocalDate due = parseDateOr400(req.getDueDate()); // accepts null

    // status (default PENDING)
    TaskStatus status = normalizeStatusOr400(
        (req.getStatus() == null || req.getStatus().isBlank()) ? "PENDING" : req.getStatus()
    );

    Task t = new Task();
    t.setTitle(req.getTitle().trim());
    t.setDescription(req.getDescription() == null ? "" : req.getDescription().trim());
    t.setDueDate(due);
    t.setStatus(status);
    t.setOwnerId(ownerId);

    return toDto(taskRepo.save(t));
  }

  /* ------------------------------ Read ------------------------------ */

  @Transactional(readOnly = true)
  public List<TaskResponse> listForUser(String email) {
    Long ownerId = findOwnerIdOr401(email);

    List<Task> tasks;
    try {
      // If you have this repo method, prefer it
      tasks = taskRepo.findByOwnerIdOrderByDueDateAsc(ownerId);
    } catch (Throwable ignore) {
      // Fallback to a simpler method then sort in memory
      tasks = taskRepo.findByOwnerId(ownerId).stream()
          .sorted(Comparator.comparing(Task::getDueDate,
              Comparator.nullsLast(Comparator.naturalOrder())))
          .toList();
    }

    return tasks.stream().map(this::toDto).toList();
  }

  @Transactional(readOnly = true)
  public TaskResponse getOneForUser(String email, Long id) {
    Long ownerId = findOwnerIdOr401(email);
    Task t = taskRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    ensureOwnershipOr403(ownerId, t);
    return toDto(t);
  }

  /* ------------------------------ Update ---------------------------- */

  public TaskResponse updateForUser(String email, Long id, TaskRequest req) {
    Long ownerId = findOwnerIdOr401(email);
    Task t = taskRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    ensureOwnershipOr403(ownerId, t);

    if (req.getTitle() != null) {
      if (req.getTitle().isBlank())
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title cannot be blank");
      t.setTitle(req.getTitle().trim());
    }

    if (req.getDescription() != null) {
      t.setDescription(req.getDescription().trim());
    }

    if (req.getDueDate() != null) {
      t.setDueDate(parseDateOr400(req.getDueDate()));
    }

    if (req.getStatus() != null) {
      t.setStatus(normalizeStatusOr400(req.getStatus()));
    }

    return toDto(taskRepo.save(t));
  }

  /** Endpoint used by the dropdown: JSON body { "status": "IN_PROGRESS" } */
  public TaskResponse updateStatusForUser(String email, Long id, String newStatusRaw) {
    Long ownerId = findOwnerIdOr401(email);
    Task t = taskRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    ensureOwnershipOr403(ownerId, t);

    TaskStatus next = normalizeStatusOr400(newStatusRaw);
    t.setStatus(next);

    return toDto(taskRepo.save(t));
  }

  /* ------------------------------ Delete ---------------------------- */

  public void deleteForUser(String email, Long id) {
    Long ownerId = findOwnerIdOr401(email);
    Task t = taskRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    ensureOwnershipOr403(ownerId, t);
    taskRepo.deleteById(id);
  }

  /* ------------------------------ Helpers --------------------------- */

  private Long findOwnerIdOr401(String email) {
    return userRepo.findByEmailIgnoreCase(email)
        .map(AppUser::getId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  private void ensureOwnershipOr403(Long ownerId, Task task) {
    if (!ownerId.equals(task.getOwnerId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your task");
    }
  }

  private LocalDate parseDateOr400(String yyyyMMddOrNull) {
    if (yyyyMMddOrNull == null || yyyyMMddOrNull.isBlank()) return null;
    try {
      return LocalDate.parse(yyyyMMddOrNull); // expects yyyy-MM-dd
    } catch (DateTimeParseException ex) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Invalid date format (use yyyy-MM-dd)");
    }
  }

  private TaskStatus normalizeStatusOr400(String raw) {
    String s = raw == null ? "" : raw.trim().toUpperCase();
    if (!ALLOWED.contains(s)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Invalid status (use one of: PENDING, IN_PROGRESS, COMPLETED)");
    }
    return TaskStatus.valueOf(s);
  }

  private TaskResponse toDto(Task t) {
    return TaskResponse.builder()
        .id(t.getId())
        .title(t.getTitle())
        .description(t.getDescription())
        .dueDate(t.getDueDate() == null ? null : t.getDueDate().toString())
        .status(t.getStatus() == null ? null : t.getStatus().name())
        .build();
  }
}
