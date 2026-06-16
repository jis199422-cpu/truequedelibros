package com.jis.truequedelibros.conversation.service;

import com.jis.truequedelibros.conversation.domain.Conversation;
import com.jis.truequedelibros.conversation.domain.Message;
import com.jis.truequedelibros.conversation.dto.ConversationResponse;
import com.jis.truequedelibros.conversation.dto.MessageResponse;
import com.jis.truequedelibros.conversation.repository.ConversationRepository;
import com.jis.truequedelibros.conversation.repository.MessageRepository;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.User;
import com.jis.truequedelibros.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional
    public Conversation findOrCreate(User u1, User u2) {
        boolean u1First = u1.getId().compareTo(u2.getId()) < 0;
        User userA = u1First ? u1 : u2;
        User userB = u1First ? u2 : u1;

        return conversationRepository.findByUserA_IdAndUserB_Id(userA.getId(), userB.getId())
                .orElseGet(() -> conversationRepository.save(
                        Conversation.builder().userA(userA).userB(userB).build()));
    }

    @Transactional
    public Conversation findOrCreateByUserId(UUID targetUserId, User currentUser) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AppException("Usuario no encontrado", HttpStatus.NOT_FOUND));
        return findOrCreate(currentUser, target);
    }

    public Optional<Conversation> findByUsers(UUID id1, UUID id2) {
        UUID userAId = id1.compareTo(id2) < 0 ? id1 : id2;
        UUID userBId = id1.compareTo(id2) < 0 ? id2 : id1;
        return conversationRepository.findByUserA_IdAndUserB_Id(userAId, userBId);
    }

    @Transactional(readOnly = true)
    public Conversation findById(UUID id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new AppException("Conversación no encontrada", HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public String getOtherParticipantEmail(UUID conversationId, String currentEmail) {
        Conversation conv = findById(conversationId);
        return conv.getUserA().getUsername().equals(currentEmail)
                ? conv.getUserB().getUsername()
                : conv.getUserA().getUsername();
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(User user) {
        return conversationRepository.findByUserId(user.getId())
                .stream().map(c -> toResponse(c, user)).toList();
    }

    public ConversationResponse toResponse(Conversation c, User currentUser) {
        User other = c.getUserA().getId().equals(currentUser.getId()) ? c.getUserB() : c.getUserA();
        Message last = messageRepository.findTopByConversation_IdOrderByCreatedAtDesc(c.getId()).orElse(null);
        long unread = messageRepository.countUnreadForUser(c.getId(), currentUser.getId());

        return ConversationResponse.builder()
                .id(c.getId())
                .otherUser(ConversationResponse.OtherUserInfo.builder()
                        .id(other.getId()).name(other.getName())
                        .profilePictureUrl(other.getProfilePictureUrl()).build())
                .lastMessage(last != null ? toMessageResponse(last) : null)
                .unreadCount((int) unread)
                .updatedAt(c.getUpdatedAt() != null ? c.getUpdatedAt().atOffset(ZoneOffset.UTC) : null)
                .build();
    }

    public MessageResponse toMessageResponse(Message m) {
        return MessageResponse.builder()
                .id(m.getId()).conversationId(m.getConversation().getId())
                .senderId(m.getSender().getId()).senderName(m.getSender().getName())
                .content(m.getContent()).read(m.getReadAt() != null)
                .createdAt(m.getCreatedAt().atOffset(ZoneOffset.UTC)).build();
    }
}
