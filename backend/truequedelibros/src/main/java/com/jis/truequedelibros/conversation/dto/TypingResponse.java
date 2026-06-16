package com.jis.truequedelibros.conversation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class TypingResponse {
    private UUID conversationId;
    private boolean typing;
}
