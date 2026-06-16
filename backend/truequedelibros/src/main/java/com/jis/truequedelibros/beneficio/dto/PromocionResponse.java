package com.jis.truequedelibros.beneficio.dto;

import java.util.UUID;

public record PromocionResponse(
        UUID id,
        String description,
        boolean active
) {}
