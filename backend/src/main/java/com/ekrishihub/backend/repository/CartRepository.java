package com.ekrishihub.backend.repository;

import com.ekrishihub.backend.entity.CartItem;
import com.ekrishihub.backend.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CartRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUser(AppUser user);
    void deleteByUser(AppUser user);
}
