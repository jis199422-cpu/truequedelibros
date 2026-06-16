package com.jis.truequedelibros.beneficio.controller;

import com.jis.truequedelibros.beneficio.dto.*;
import com.jis.truequedelibros.beneficio.service.BeneficioService;
import com.jis.truequedelibros.book.dto.UploadUrlRequest;
import com.jis.truequedelibros.book.dto.UploadUrlResponse;
import com.jis.truequedelibros.storage.S3StorageService;
import com.jis.truequedelibros.user.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminBeneficioController {

    private final BeneficioService beneficioService;
    private final S3StorageService s3StorageService;

    // ── Logo upload ───────────────────────────────────────────────────────────

    @PostMapping("/locales/logo-upload-url")
    public ResponseEntity<UploadUrlResponse> getLogoUploadUrl(
            @Valid @RequestBody UploadUrlRequest request) {
        return ResponseEntity.ok(
                s3StorageService.generateUploadUrl("locales", request.getFileName(), request.getContentType()));
    }

    // ── Locales ───────────────────────────────────────────────────────────────

    @PostMapping("/locales")
    public ResponseEntity<LocalResponse> createLocal(
            @Valid @RequestBody LocalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(beneficioService.adminCreateLocal(request));
    }

    @PutMapping("/locales/{localId}")
    public ResponseEntity<LocalResponse> updateLocal(
            @PathVariable UUID localId,
            @Valid @RequestBody LocalRequest request) {
        return ResponseEntity.ok(beneficioService.adminUpdateLocal(localId, request));
    }

    @DeleteMapping("/locales/{localId}")
    public ResponseEntity<Void> deleteLocal(@PathVariable UUID localId) {
        beneficioService.adminDeleteLocal(localId);
        return ResponseEntity.noContent().build();
    }

    // ── Promociones ───────────────────────────────────────────────────────────

    @PostMapping("/locales/{localId}/promociones")
    public ResponseEntity<PromocionResponse> createPromocion(
            @PathVariable UUID localId,
            @Valid @RequestBody PromocionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(beneficioService.adminCreatePromocion(localId, request));
    }

    @PutMapping("/locales/{localId}/promociones/{promocionId}")
    public ResponseEntity<PromocionResponse> updatePromocion(
            @PathVariable UUID localId,
            @PathVariable UUID promocionId,
            @Valid @RequestBody PromocionRequest request) {
        return ResponseEntity.ok(
                beneficioService.adminUpdatePromocion(localId, promocionId, request));
    }

    @DeleteMapping("/locales/{localId}/promociones/{promocionId}")
    public ResponseEntity<Void> deletePromocion(
            @PathVariable UUID localId,
            @PathVariable UUID promocionId) {
        beneficioService.adminDeletePromocion(localId, promocionId);
        return ResponseEntity.noContent().build();
    }

    // ── Usuarios LOCAL ────────────────────────────────────────────────────────

    @PostMapping("/local-users")
    public ResponseEntity<Void> createLocalUser(
            @Valid @RequestBody CreateLocalUserRequest request) {
        beneficioService.adminCreateLocalUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
