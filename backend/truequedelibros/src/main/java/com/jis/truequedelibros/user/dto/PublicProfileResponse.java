package com.jis.truequedelibros.user.dto;

import com.jis.truequedelibros.book.dto.BookResponse;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PublicProfileResponse {
    private UUID id;
    private String name;
    private String bio;
    private String city;
    private String profilePictureUrl;
    private List<BookResponse> books;
    private boolean premium;
}
