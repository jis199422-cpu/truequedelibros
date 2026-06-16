package com.jis.truequedelibros.conversation.service;

import com.jis.truequedelibros.conversation.domain.Conversation;
import com.jis.truequedelibros.conversation.domain.Message;
import com.jis.truequedelibros.conversation.dto.MessageResponse;
import com.jis.truequedelibros.conversation.dto.SendMessageRequest;
import com.jis.truequedelibros.conversation.repository.ConversationRepository;
import com.jis.truequedelibros.conversation.repository.MessageRepository;
import com.jis.truequedelibros.auth.service.EmailService;
import com.jis.truequedelibros.notification.service.NotificationService;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.User;
import com.jis.truequedelibros.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationService conversationService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public MessageResponse send(UUID conversationId, String senderEmail, SendMessageRequest request) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException("Conversación no encontrada", HttpStatus.NOT_FOUND));

        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new AppException("Usuario no encontrado", HttpStatus.NOT_FOUND));

        assertParticipant(conversation, sender.getId());

        Message message = messageRepository.save(Message.builder()
                .conversation(conversation).sender(sender).content(request.getContent()).build());

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        User recipient = conversation.getUserA().getId().equals(sender.getId())
                ? conversation.getUserB() : conversation.getUserA();
        notificationService.notifyNewMessage(recipient, sender, conversationId);
        emailService.sendNewMessageEmail(recipient.getEmail(), recipient.getName(), sender.getName());

        return conversationService.toMessageResponse(message);
    }

    @Transactional
    public List<MessageResponse> getMessages(UUID conversationId, User user, int page) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException("Conversación no encontrada", HttpStatus.NOT_FOUND));

        assertParticipant(conversation, user.getId());

        PageRequest pageable = PageRequest.of(page, 50, Sort.by("createdAt").descending());
        List<MessageResponse> messages = messageRepository
                .findByConversation_IdOrderByCreatedAtDesc(conversationId, pageable)
                .stream().map(conversationService::toMessageResponse).toList();

        messageRepository.markAsRead(conversationId, user.getId(), LocalDateTime.now());
        notificationService.markConversationNotificationsRead(user.getId(), conversationId);

        return messages;
    }

    private void assertParticipant(Conversation c, UUID userId) {
        if (!c.getUserA().getId().equals(userId) && !c.getUserB().getId().equals(userId)) {
            throw new AppException("No tienes acceso a esta conversación", HttpStatus.FORBIDDEN);
        }
    }
}
