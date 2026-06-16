package com.jis.truequedelibros.match.dto;

import com.jis.truequedelibros.book.dto.BookResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MatchResponse {
    private UUID id;
    private UUID conversationId;
    private OtherUserInfo otherUser;
    private BookResponse bookYouLiked;
    private BookResponse bookTheyLiked;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class OtherUserInfo {
        private UUID id;
        private String name;
        private String profilePictureUrl;
        private String city;
    }
}
