package com.jis.truequedelibros.beneficio.controller;

import com.jis.truequedelibros.beneficio.dto.CanjeResponse;
import com.jis.truequedelibros.beneficio.dto.GenerarCuponRequest;
import com.jis.truequedelibros.beneficio.dto.GenerarCuponResponse;
import com.jis.truequedelibros.beneficio.service.BeneficioService;
import com.jis.truequedelibros.user.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/beneficios")
@RequiredArgsConstructor
public class BeneficioController {

    private final BeneficioService beneficioService;

    @PostMapping("/generar")
    public ResponseEntity<GenerarCuponResponse> generarCupon(
            @Valid @RequestBody GenerarCuponRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(beneficioService.generarCupon(user, request));
    }

    @GetMapping("/activo/{localId}")
    public ResponseEntity<GenerarCuponResponse> getCuponActivo(
            @PathVariable UUID localId,
            @AuthenticationPrincipal User user) {
        return beneficioService.getCuponActivo(user, localId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{cuponId}")
    public ResponseEntity<Void> cancelarCupon(
            @PathVariable UUID cuponId,
            @AuthenticationPrincipal User user) {
        beneficioService.cancelarCupon(user, cuponId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/mis-cupones")
    public ResponseEntity<List<CanjeResponse>> getMisCupones(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(beneficioService.getMisCupones(user));
    }
}
