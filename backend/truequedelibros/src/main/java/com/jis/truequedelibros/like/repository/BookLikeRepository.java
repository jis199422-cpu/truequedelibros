package com.jis.truequedelibros.like.repository;

import com.jis.truequedelibros.like.domain.BookLike;
import com.jis.truequedelibros.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookLikeRepository extends JpaRepository<BookLike, UUID> {
    Optional<BookLike> findByLiker_IdAndBook_Id(UUID likerId, UUID bookId);
    boolean existsByLiker_IdAndBook_Id(UUID likerId, UUID bookId);

    // "Has userId liked any book owned by ownerId?" — used for mutual match detection
    Optional<BookLike> findFirstByLiker_IdAndBook_Owner_Id(UUID likerId, UUID ownerId);

    @Query("SELECT bl.book.id FROM BookLike bl WHERE bl.liker.id = :likerId AND bl.book.id IN :bookIds")
    List<UUID> findLikedBookIds(@Param("likerId") UUID likerId, @Param("bookIds") List<UUID> bookIds);

    @Query("SELECT bl FROM BookLike bl WHERE bl.book.owner = :user " +
           "AND NOT EXISTS (SELECT m FROM Match m WHERE " +
           "  (m.userA = bl.liker AND m.userB = :user) OR " +
           "  (m.userB = bl.liker AND m.userA = :user)) " +
           "ORDER BY bl.createdAt DESC")
    Page<BookLike> findPendingLikesReceivedBy(@Param("user") User user, Pageable pageable);

    @Query("SELECT COUNT(bl) FROM BookLike bl WHERE bl.liker.id = :likerId AND bl.createdAt >= :start AND bl.createdAt < :end")
    long countDailyLikes(@Param("likerId") UUID likerId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT MIN(bl.createdAt) FROM BookLike bl WHERE bl.liker.id = :likerId AND bl.createdAt >= :windowStart")
    Optional<LocalDateTime> findOldestCreatedAtSince(@Param("likerId") UUID likerId, @Param("windowStart") LocalDateTime windowStart);

    @Transactional
    void deleteByLiker_IdAndBook_Id(UUID likerId, UUID bookId);

    @Transactional
    void deleteByBook_Id(UUID bookId);
}
