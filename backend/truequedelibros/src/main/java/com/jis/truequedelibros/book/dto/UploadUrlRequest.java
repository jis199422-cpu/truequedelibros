package com.jis.truequedelibros.book.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UploadUrlRequest {

    @NotBlank(message = "El nombre del archivo es obligatorio")
    private String fileName;

    @NotBlank(message = "El tipo de contenido es obligatorio")
    private String contentType;
}
