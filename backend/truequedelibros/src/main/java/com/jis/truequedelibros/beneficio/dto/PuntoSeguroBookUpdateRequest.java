package com.jis.truequedelibros.beneficio.dto;

import com.jis.truequedelibros.book.domain.BookCondition;
import com.jis.truequedelibros.book.domain.BookStatus;

public record PuntoSeguroBookUpdateRequest(
        String title,
        String author,
        String genre,
        BookCondition condition,
        String description,
        String coverImageUrl,
        BookStatus status,
        Boolean venta
) {}
