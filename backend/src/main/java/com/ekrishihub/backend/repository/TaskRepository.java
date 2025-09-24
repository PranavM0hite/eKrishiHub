package com.ekrishihub.backend.repository;


import com.ekrishihub.backend.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
	List<Task> findByOwnerIdOrderByDueDateAsc(Long ownerId);
	List<Task> findByOwnerId(Long ownerId);

}
