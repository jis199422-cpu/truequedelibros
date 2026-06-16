package com.jis.truequedelibros.beneficio.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record GenerarCuponResponse(
        UUID cuponId,
        String code,
        LocalDateTime expiresAt
) {}
