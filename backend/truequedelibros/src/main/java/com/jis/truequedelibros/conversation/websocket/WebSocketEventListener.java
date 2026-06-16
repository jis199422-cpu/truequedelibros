package com.jis.truequedelibros.conversation.websocket;

import com.jis.truequedelibros.conversation.repository.ConversationRepository;
import com.jis.truequedelibros.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final PresenceService presenceService;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    @Transactional(readOnly = true)
    public void onConnect(SessionConnectedEvent event) {
        Principal principal = event.getUser();
        if (principal == null) return;

        String email = principal.getName();
        String sessionId = SimpMessageHeaderAccessor.wrap(event.getMessage()).getSessionId();
        if (sessionId == null) return;

        boolean justCameOnline = presenceService.markOnline(email, sessionId);
        if (!justCameOnline) return;

        userRepository.findByEmail(email)
                .ifPresent(u -> notifyPartners(u.getId(), true));
    }

    @EventListener
    @Transactional(readOnly = true)
    public void onDisconnect(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        if (principal == null) return;

        String email = principal.getName();
        String sessionId = event.getSessionId();

        boolean justWentOffline = presenceService.markOffline(email, sessionId);
        if (!justWentOffline) return;

        userRepository.findByEmail(email)
                .ifPresent(u -> notifyPartners(u.getId(), false));
    }

    private void notifyPartners(UUID userId, boolean online) {
        List<String> partnerEmails = conversationRepository.findPartnerEmailsByUserId(userId);
        PresenceEvent presenceEvent = new PresenceEvent(userId, online);
        for (String partnerEmail : partnerEmails) {
            messagingTemplate.convertAndSendToUser(partnerEmail, "/topic/presence", presenceEvent);
        }
    }
}
