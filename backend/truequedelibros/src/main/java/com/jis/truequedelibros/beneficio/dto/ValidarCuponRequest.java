package com.jis.truequedelibros.beneficio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ValidarCuponRequest(
        @NotBlank @Size(min = 5, max = 5) String code
) {}
