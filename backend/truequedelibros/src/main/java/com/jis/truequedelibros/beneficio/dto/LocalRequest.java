package com.jis.truequedelibros.beneficio.dto;

import com.jis.truequedelibros.beneficio.domain.LocalCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record LocalRequest(
        @NotBlank String name,
        @NotBlank String address,
        String logoUrl,
        String cartaUrl,
        @NotNull LocalCategory category,
        @NotNull UUID ownerId,
        Double latitude,
        Double longitude
) {}
