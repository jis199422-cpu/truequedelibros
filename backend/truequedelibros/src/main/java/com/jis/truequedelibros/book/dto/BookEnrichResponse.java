package com.jis.truequedelibros.book.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookEnrichResponse {
    private String title;
    private String author;
    private String genre;
    private String description;
}
