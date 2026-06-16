package com.jis.truequedelibros.book.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UploadUrlResponse {
    private String uploadUrl;
    private String imageUrl;
}
