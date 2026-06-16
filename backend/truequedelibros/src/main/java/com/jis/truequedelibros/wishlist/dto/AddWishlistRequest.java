package com.jis.truequedelibros.wishlist.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class AddWishlistRequest {

    @NotBlank(message = "El título no puede estar vacío")
    @Size(max = 255, message = "El título es demasiado largo")
    private String bookTitle;
}
