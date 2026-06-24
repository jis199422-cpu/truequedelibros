package com.jis.truequedelibros.beneficio.dto;

import com.jis.truequedelibros.book.domain.BookCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PuntoSeguroBookRequest(
        @NotBlank String title,
        @NotBlank String author,
        String genre,
        @NotNull BookCondition condition,
        String description,
        String coverImageUrl
) {}
