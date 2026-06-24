package com.jis.truequedelibros.beneficio.controller;

import com.jis.truequedelibros.beneficio.dto.LocalResponse;
import com.jis.truequedelibros.beneficio.dto.PuntoSeguroBookResponse;
import com.jis.truequedelibros.beneficio.dto.ReportBookRequest;
import com.jis.truequedelibros.beneficio.service.BeneficioService;
import com.jis.truequedelibros.beneficio.service.PuntoSeguroBookService;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/locales")
@RequiredArgsConstructor
public class LocalPublicController {

    private final BeneficioService beneficioService;
    private final PuntoSeguroBookService puntoSeguroBookService;

    @GetMapping
    public ResponseEntity<List<LocalResponse>> getLocales() {
        return ResponseEntity.ok(beneficioService.getActiveLocales());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocalResponse> getLocal(@PathVariable UUID id) {
        return ResponseEntity.ok(beneficioService.getLocalById(id));
    }

    @GetMapping("/{localId}/books")
    public ResponseEntity<List<PuntoSeguroBookResponse>> getLocalBooks(@PathVariable UUID localId) {
        return ResponseEntity.ok(puntoSeguroBookService.getBooksByLocal(localId));
    }

    @PostMapping("/{localId}/books/{bookId}/report")
    public ResponseEntity<Void> reportBook(
            @PathVariable UUID localId,
            @PathVariable UUID bookId,
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) ReportBookRequest request) {
        String message = request != null ? request.message() : null;
        puntoSeguroBookService.reportBookUnavailable(localId, bookId, user, message);
        return ResponseEntity.ok().build();
    }
}
