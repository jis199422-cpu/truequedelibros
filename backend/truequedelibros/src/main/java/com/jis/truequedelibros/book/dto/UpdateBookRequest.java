package com.jis.truequedelibros.book.dto;

import com.jis.truequedelibros.book.domain.BookCondition;
import com.jis.truequedelibros.book.domain.BookStatus;
import com.jis.truequedelibros.book.domain.Genre;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class UpdateBookRequest {

    @Size(max = 255, message = "El título no puede superar 255 caracteres")
    private String title;

    @Size(max = 255, message = "El autor no puede superar 255 caracteres")
    private String author;

    private String genre;

    @AssertTrue(message = "El género no es válido")
    public boolean isGenreValid() {
        if (genre == null || genre.isBlank()) return true;
        try { Genre.valueOf(genre); return true; } catch (IllegalArgumentException e) { return false; }
    }

    private BookCondition condition;

    @Size(max = 1000, message = "La descripción no puede superar 1000 caracteres")
    private String description;

    private String coverImageUrl;

    private BookStatus status;

    private Boolean regalo;
    private Boolean trueque;
    private Boolean venta;

    @Positive(message = "El precio debe ser mayor a cero")
    private BigDecimal precio;
}
