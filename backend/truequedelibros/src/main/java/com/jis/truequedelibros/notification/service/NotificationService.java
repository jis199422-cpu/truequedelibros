package com.jis.truequedelibros.notification.service;

import com.jis.truequedelibros.auth.service.EmailService;
import com.jis.truequedelibros.notification.domain.Notification;
import com.jis.truequedelibros.notification.domain.NotificationType;
import com.jis.truequedelibros.notification.dto.NotificationResponse;
import com.jis.truequedelibros.notification.repository.NotificationRepository;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;

    public void notifyBookLiked(User bookOwner, User liker, String bookTitle, UUID bookId) {
        String text = liker.getName() + " le dio like a tu libro \"" + bookTitle + "\"";
        push(bookOwner, NotificationType.BOOK_LIKED, bookId, text);
        emailService.sendBookLikedEmail(bookOwner.getEmail(), bookOwner.getName(), liker.getName(), bookTitle);
    }

    public void notifyMatch(User userA, User userB, UUID matchId) {
        String textA = "¡Hiciste match con " + userB.getName() + "! Empieza a chatear.";
        String textB = "¡Hiciste match con " + userA.getName() + "! Empieza a chatear.";
        push(userA, NotificationType.MATCH, matchId, textA);
        push(userB, NotificationType.MATCH, matchId, textB);
        emailService.sendMatchEmail(userA.getEmail(), userA.getName(), userB.getName());
        emailService.sendMatchEmail(userB.getEmail(), userB.getName(), userA.getName());
    }

    public void notifyNewMessage(User recipient, User sender, UUID conversationId) {
        String text = "Nuevo mensaje de " + sender.getName();
        push(recipient, NotificationType.NEW_MESSAGE, conversationId, text);
    }

    public void notifyWishlistMatch(User recipient, String bookTitle, String city, UUID bookId) {
        String location = city != null ? " en " + city : "";
        String text = "Alguien" + location + " publicó «" + bookTitle + "», que tienes en tu lista de deseos";
        push(recipient, NotificationType.WISHLIST_MATCH, bookId, text);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getForUser(UUID userId) {
        return notificationRepository.findByRecipient_IdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long countUnread(UUID userId) {
        return notificationRepository.countByRecipient_IdAndReadAtIsNull(userId);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.markAllAsRead(userId, LocalDateTime.now());
    }

    @Transactional
    public void markConversationNotificationsRead(UUID userId, UUID conversationId) {
        notificationRepository.markAsReadByTypeAndReference(
                userId, NotificationType.NEW_MESSAGE, conversationId, LocalDateTime.now());
    }

    private void push(User recipient, NotificationType type, UUID referenceId, String text) {
        Notification saved = notificationRepository.save(Notification.builder()
                .recipient(recipient).type(type).referenceId(referenceId).text(text).build());

        messagingTemplate.convertAndSendToUser(
                recipient.getEmail(), "/topic/notifications", toResponse(saved));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId()).type(n.getType().name()).text(n.getText())
                .referenceId(n.getReferenceId()).read(n.getReadAt() != null)
                .createdAt(n.getCreatedAt()).build();
    }
}
