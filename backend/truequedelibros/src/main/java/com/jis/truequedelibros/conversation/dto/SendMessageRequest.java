package com.jis.truequedelibros.conversation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotBlank(message = "El mensaje no puede estar vacío")
    @Size(max = 2000, message = "El mensaje no puede superar 2000 caracteres")
    private String content;
}
