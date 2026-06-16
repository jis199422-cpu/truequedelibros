package com.jis.truequedelibros.wishlist.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
@Getter
public class WishlistItemResponse {
    private UUID id;
    private String bookTitle;
    private LocalDateTime createdAt;
}
