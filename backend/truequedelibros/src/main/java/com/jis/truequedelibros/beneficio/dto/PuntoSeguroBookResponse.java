package com.jis.truequedelibros.beneficio.dto;

import com.jis.truequedelibros.book.domain.BookCondition;
import com.jis.truequedelibros.book.domain.BookStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record PuntoSeguroBookResponse(
        UUID id,
        String title,
        String author,
        String genre,
        BookCondition condition,
        String description,
        String coverImageUrl,
        BookStatus status,
        UUID localId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
