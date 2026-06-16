package com.jis.truequedelibros.beneficio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PromocionRequest(
        @NotBlank @Size(max = 500) String description
) {}
