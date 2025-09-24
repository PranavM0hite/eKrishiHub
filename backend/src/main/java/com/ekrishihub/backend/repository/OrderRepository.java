package com.ekrishihub.backend.repository;

import com.ekrishihub.backend.entity.Order;
import com.ekrishihub.backend.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface OrderRepository extends JpaRepository<Order, Long> {
  
    List<Order> findByCustomerId(Long customerId);
    List<Order> findByProductIdIn(Set<Long> productIds);
}
