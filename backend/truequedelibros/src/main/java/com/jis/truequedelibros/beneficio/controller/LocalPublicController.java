package com.jis.truequedelibros.beneficio.controller;

import com.jis.truequedelibros.beneficio.dto.LocalResponse;
import com.jis.truequedelibros.beneficio.service.BeneficioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/locales")
@RequiredArgsConstructor
public class LocalPublicController {

    private final BeneficioService beneficioService;

    @GetMapping
    public ResponseEntity<List<LocalResponse>> getLocales() {
        return ResponseEntity.ok(beneficioService.getActiveLocales());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocalResponse> getLocal(@PathVariable UUID id) {
        return ResponseEntity.ok(beneficioService.getLocalById(id));
    }
}
