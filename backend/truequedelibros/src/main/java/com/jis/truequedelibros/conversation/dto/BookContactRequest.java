package com.jis.truequedelibros.conversation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class BookContactRequest {

    @NotNull
    private UUID bookId;
}
