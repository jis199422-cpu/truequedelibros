package com.jis.truequedelibros.notification.repository;

import com.jis.truequedelibros.notification.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByRecipient_IdOrderByCreatedAtDesc(UUID recipientId);

    long countByRecipient_IdAndReadAtIsNull(UUID recipientId);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.readAt = :now WHERE n.recipient.id = :userId AND n.readAt IS NULL")
    void markAllAsRead(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.readAt = :now WHERE n.recipient.id = :userId AND n.type = :type AND n.referenceId = :referenceId AND n.readAt IS NULL")
    void markAsReadByTypeAndReference(
            @Param("userId") UUID userId,
            @Param("type") com.jis.truequedelibros.notification.domain.NotificationType type,
            @Param("referenceId") UUID referenceId,
            @Param("now") LocalDateTime now);
}
