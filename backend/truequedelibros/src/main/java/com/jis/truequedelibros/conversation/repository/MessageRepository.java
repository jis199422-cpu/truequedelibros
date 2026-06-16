package com.jis.truequedelibros.conversation.repository;

import com.jis.truequedelibros.conversation.domain.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByConversation_IdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    Optional<Message> findTopByConversation_IdOrderByCreatedAtDesc(UUID conversationId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :convId AND m.sender.id != :userId AND m.readAt IS NULL")
    long countUnreadForUser(@Param("convId") UUID convId, @Param("userId") UUID userId);

    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.readAt = :now WHERE m.conversation.id = :convId AND m.sender.id != :userId AND m.readAt IS NULL")
    void markAsRead(@Param("convId") UUID convId, @Param("userId") UUID userId, @Param("now") LocalDateTime now);
}
