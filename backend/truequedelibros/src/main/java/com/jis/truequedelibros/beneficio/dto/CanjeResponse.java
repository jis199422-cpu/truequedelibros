package com.jis.truequedelibros.beneficio.dto;

import com.jis.truequedelibros.beneficio.domain.CuponStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record CanjeResponse(
        UUID cuponId,
        String code,
        String localName,
        String promotionDescription,
        CuponStatus status,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        LocalDateTime validatedAt
) {}
