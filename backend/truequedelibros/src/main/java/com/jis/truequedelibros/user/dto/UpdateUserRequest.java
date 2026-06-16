package com.jis.truequedelibros.user.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
    private String name;

    @Size(max = 500, message = "La bio no puede superar 500 caracteres")
    private String bio;

    private String profilePictureUrl;
}
