package com.jis.truequedelibros.conversation.websocket;

import com.jis.truequedelibros.conversation.dto.MessageResponse;
import com.jis.truequedelibros.conversation.dto.SendMessageRequest;
import com.jis.truequedelibros.conversation.dto.TypingRequest;
import com.jis.truequedelibros.conversation.dto.TypingResponse;
import com.jis.truequedelibros.conversation.service.ConversationService;
import com.jis.truequedelibros.conversation.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final MessageService messageService;
    private final ConversationService conversationService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{conversationId}")
    public void handleMessage(
            @DestinationVariable UUID conversationId,
            @Payload SendMessageRequest request,
            Principal principal) {

        MessageResponse message = messageService.send(conversationId, principal.getName(), request);
        String otherEmail = conversationService.getOtherParticipantEmail(conversationId, principal.getName());

        messagingTemplate.convertAndSendToUser(principal.getName(), "/topic/messages", message);
        messagingTemplate.convertAndSendToUser(otherEmail, "/topic/messages", message);
    }

    @MessageMapping("/chat/{conversationId}/typing")
    public void handleTyping(
            @DestinationVariable UUID conversationId,
            @Payload TypingRequest request,
            Principal principal) {

        String otherEmail = conversationService.getOtherParticipantEmail(conversationId, principal.getName());

        messagingTemplate.convertAndSendToUser(
                otherEmail, "/topic/typing", new TypingResponse(conversationId, request.isTyping()));
    }
}
