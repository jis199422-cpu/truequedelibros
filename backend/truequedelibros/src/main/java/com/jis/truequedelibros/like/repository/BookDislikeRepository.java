package com.jis.truequedelibros.like.repository;

import com.jis.truequedelibros.like.domain.BookDislike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

public interface BookDislikeRepository extends JpaRepository<BookDislike, UUID> {
    boolean existsByDisliker_IdAndBook_Id(UUID dislikerId, UUID bookId);
    Optional<BookDislike> findByDisliker_IdAndBook_Id(UUID dislikerId, UUID bookId);

    @Transactional
    void deleteByDisliker_IdAndBook_Id(UUID dislikerId, UUID bookId);

    @Transactional
    void deleteByBook_Id(UUID bookId);
}
