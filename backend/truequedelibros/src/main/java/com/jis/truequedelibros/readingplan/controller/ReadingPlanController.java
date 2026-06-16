package com.jis.truequedelibros.readingplan.controller;

import com.jis.truequedelibros.readingplan.dto.CreateReadingPlanRequest;
import com.jis.truequedelibros.readingplan.dto.ReadingPlanResponse;
import com.jis.truequedelibros.readingplan.dto.ReadingPlansPageResponse;
import com.jis.truequedelibros.readingplan.dto.UpdateReadingPlanRequest;
import com.jis.truequedelibros.readingplan.service.ReadingPlanService;
import com.jis.truequedelibros.user.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/reading-plans")
@RequiredArgsConstructor
public class ReadingPlanController {

    private final ReadingPlanService readingPlanService;

    @GetMapping
    public ResponseEntity<ReadingPlansPageResponse> getPlans(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(readingPlanService.getPlans(user, page));
    }

    @PostMapping
    public ResponseEntity<ReadingPlanResponse> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateReadingPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(readingPlanService.create(user, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReadingPlanResponse> update(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateReadingPlanRequest request) {
        return ResponseEntity.ok(readingPlanService.update(id, user, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        readingPlanService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ReadingPlanResponse> join(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(readingPlanService.join(id, user));
    }

    @DeleteMapping("/{id}/join")
    public ResponseEntity<ReadingPlanResponse> leave(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(readingPlanService.leave(id, user));
    }
}
