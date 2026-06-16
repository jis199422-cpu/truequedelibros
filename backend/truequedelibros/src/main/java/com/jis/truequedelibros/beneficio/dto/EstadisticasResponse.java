package com.jis.truequedelibros.beneficio.dto;

public record EstadisticasResponse(
        long totalValidados,
        long totalExpirados,
        long totalPendiente,
        long validadosHoy,
        long validadosMes
) {}
