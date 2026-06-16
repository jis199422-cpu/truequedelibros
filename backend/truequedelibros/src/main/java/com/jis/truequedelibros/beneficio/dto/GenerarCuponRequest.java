package com.jis.truequedelibros.beneficio.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record GenerarCuponRequest(
        @NotNull UUID localId,
        @NotNull UUID promocionId
) {}
