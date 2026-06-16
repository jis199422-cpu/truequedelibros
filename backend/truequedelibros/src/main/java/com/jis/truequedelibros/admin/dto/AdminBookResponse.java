package com.jis.truequedelibros.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
@Getter
public class AdminBookResponse {
    private UUID id;
    private String title;
    private String author;
    private String genre;
    private String condition;
    private String status;
    private String coverImageUrl;
    private OwnerInfo owner;
    private LocalDateTime createdAt;

    @Builder
    @Getter
    public static class OwnerInfo {
        private UUID id;
        private String name;
        private String email;
    }
}
