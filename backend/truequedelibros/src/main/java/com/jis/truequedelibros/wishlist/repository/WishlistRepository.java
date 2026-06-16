package com.jis.truequedelibros.wishlist.repository;

import com.jis.truequedelibros.wishlist.domain.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WishlistRepository extends JpaRepository<WishlistItem, UUID> {
    List<WishlistItem> findByUser_IdOrderByCreatedAtDesc(UUID userId);
    boolean existsByUser_IdAndBookTitleIgnoreCase(UUID userId, String bookTitle);
    List<WishlistItem> findByBookTitleIgnoreCase(String bookTitle);
}
