package com.jis.truequedelibros.beneficio.controller;

import com.jis.truequedelibros.beneficio.dto.CanjeResponse;
import com.jis.truequedelibros.beneficio.dto.EstadisticasResponse;
import com.jis.truequedelibros.beneficio.dto.ValidarCuponRequest;
import com.jis.truequedelibros.beneficio.dto.ValidarCuponResponse;
import com.jis.truequedelibros.beneficio.service.BeneficioService;
import com.jis.truequedelibros.beneficio.service.CuponValidationService;
import com.jis.truequedelibros.user.domain.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/locales/{localId}")
@RequiredArgsConstructor
@PreAuthorize("hasRole('LOCAL')")
public class LocalDashboardController {

    private final CuponValidationService validationService;
    private final BeneficioService beneficioService;

    @PostMapping("/cupones/validar")
    public ResponseEntity<ValidarCuponResponse> validar(
            @PathVariable UUID localId,
            @Valid @RequestBody ValidarCuponRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(
                validationService.validarCupon(user, localId, request, httpRequest));
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<EstadisticasResponse> getEstadisticas(
            @PathVariable UUID localId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(beneficioService.getEstadisticas(user, localId));
    }

    @GetMapping("/canjes")
    public ResponseEntity<Page<CanjeResponse>> getCanjes(
            @PathVariable UUID localId,
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(beneficioService.getCanjes(user, localId, page));
    }
}
