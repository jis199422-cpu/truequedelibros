package com.jis.truequedelibros.beneficio.dto;

import com.jis.truequedelibros.beneficio.domain.LocalCategory;

import java.util.List;
import java.util.UUID;

public record LocalResponse(
        UUID id,
        String name,
        String address,
        String logoUrl,
        String cartaUrl,
        LocalCategory category,
        UUID ownerId,
        String ownerName,
        List<PromocionResponse> promociones,
        Double latitude,
        Double longitude
) {}
