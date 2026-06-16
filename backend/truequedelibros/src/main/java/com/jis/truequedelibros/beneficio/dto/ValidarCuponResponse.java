package com.jis.truequedelibros.beneficio.dto;

public record ValidarCuponResponse(
        boolean valid,
        String message,
        String userName,
        String promotionName
) {}
