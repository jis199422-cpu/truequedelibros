package com.jis.truequedelibros.book.dto;

import com.jis.truequedelibros.book.domain.BookCondition;
import com.jis.truequedelibros.book.domain.BookStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BookResponse {

    private UUID id;
    private String title;
    private String author;
    private String genre;
    private BookCondition condition;
    private String description;
    private String coverImageUrl;
    private BookStatus status;
    private OwnerInfo owner;
    private LocalDateTime createdAt;
    private Double distanceKm;
    private boolean regalo;
    private boolean trueque;
    private boolean venta;
    private BigDecimal precio;

    @Data
    @Builder
    public static class OwnerInfo {
        private UUID id;
        private String name;
        private String profilePictureUrl;
        private String city;
    }
}
