package com.jis.truequedelibros.conversation.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class ConversationResponse {
    private UUID id;
    private OtherUserInfo otherUser;
    private MessageResponse lastMessage;
    private int unreadCount;
    private OffsetDateTime updatedAt;

    @Data
    @Builder
    public static class OtherUserInfo {
        private UUID id;
        private String name;
        private String profilePictureUrl;
    }
}
