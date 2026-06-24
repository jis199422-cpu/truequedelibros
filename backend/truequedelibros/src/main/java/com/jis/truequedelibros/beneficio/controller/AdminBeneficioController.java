package com.jis.truequedelibros.beneficio.controller;

import com.jis.truequedelibros.beneficio.dto.*;
import com.jis.truequedelibros.beneficio.service.BeneficioService;
import com.jis.truequedelibros.beneficio.service.PuntoSeguroBookService;
import com.jis.truequedelibros.book.dto.UploadUrlRequest;
import com.jis.truequedelibros.book.dto.UploadUrlResponse;
import com.jis.truequedelibros.storage.S3StorageService;
import com.jis.truequedelibros.user.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminBeneficioController {

    private final BeneficioService beneficioService;
    private final PuntoSeguroBookService puntoSeguroBookService;
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

    // ── Libros de punto seguro ───────────────────────────────────────────────

    @GetMapping("/locales/{localId}/books")
    public ResponseEntity<List<PuntoSeguroBookResponse>> getLocalBooks(
            @PathVariable UUID localId) {
        return ResponseEntity.ok(puntoSeguroBookService.getBooksByLocal(localId));
    }

    @PostMapping("/locales/{localId}/books")
    public ResponseEntity<PuntoSeguroBookResponse> createLocalBook(
            @PathVariable UUID localId,
            @Valid @RequestBody PuntoSeguroBookRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(puntoSeguroBookService.adminCreateBook(localId, request));
    }

    @PutMapping("/locales/{localId}/books/{bookId}")
    public ResponseEntity<PuntoSeguroBookResponse> updateLocalBook(
            @PathVariable UUID localId,
            @PathVariable UUID bookId,
            @Valid @RequestBody PuntoSeguroBookUpdateRequest request) {
        return ResponseEntity.ok(puntoSeguroBookService.adminUpdateBook(localId, bookId, request));
    }

    @DeleteMapping("/locales/{localId}/books/{bookId}")
    public ResponseEntity<Void> deleteLocalBook(
            @PathVariable UUID localId,
            @PathVariable UUID bookId) {
        puntoSeguroBookService.adminDeleteBook(localId, bookId);
        return ResponseEntity.noContent().build();
    }
}
