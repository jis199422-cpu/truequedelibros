package com.jis.truequedelibros.like.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReceivedLikeResponse(
        LikerInfo liker,
        BookInfo bookLiked,
        LocalDateTime createdAt
) {
    public record LikerInfo(UUID id, String name, String profilePictureUrl, String city, int bookCount) {}
    public record BookInfo(UUID id, String title, String author, String coverImageUrl) {}
}
