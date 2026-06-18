package com.jis.truequedelibros.conversation.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class MessageResponse {
    private UUID id;
    private UUID conversationId;
    private UUID senderId;
    private String senderName;
    private String content;
    private boolean read;
    private boolean system;
    private OffsetDateTime createdAt;
}
