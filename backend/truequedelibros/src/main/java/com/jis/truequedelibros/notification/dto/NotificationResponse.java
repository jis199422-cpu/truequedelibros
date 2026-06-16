package com.jis.truequedelibros.notification.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private String type;
    private String text;
    private UUID referenceId;
    private boolean read;
    private LocalDateTime createdAt;
}
