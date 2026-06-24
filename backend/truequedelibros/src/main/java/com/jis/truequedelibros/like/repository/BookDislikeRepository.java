package com.jis.truequedelibros.like.repository;

import com.jis.truequedelibros.like.domain.BookDislike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookDislikeRepository extends JpaRepository<BookDislike, UUID> {
    boolean existsByDisliker_IdAndBook_Id(UUID dislikerId, UUID bookId);
    Optional<BookDislike> findByDisliker_IdAndBook_Id(UUID dislikerId, UUID bookId);

    @Query("SELECT bd.book.id FROM BookDislike bd WHERE bd.disliker.id = :dislikerId AND bd.book.id IN :bookIds")
    List<UUID> findDislikedBookIds(@Param("dislikerId") UUID dislikerId, @Param("bookIds") List<UUID> bookIds);

    @Transactional
    void deleteByDisliker_IdAndBook_Id(UUID dislikerId, UUID bookId);

    @Transactional
    void deleteByBook_Id(UUID bookId);
}
