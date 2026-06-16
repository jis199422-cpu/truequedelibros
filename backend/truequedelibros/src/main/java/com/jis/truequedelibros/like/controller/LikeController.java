package com.jis.truequedelibros.like.controller;

import com.jis.truequedelibros.like.service.LikeService;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    @PostMapping("/{bookId}/like")
    public ResponseEntity<Map<String, Object>> like(
            @PathVariable UUID bookId,
            @AuthenticationPrincipal User user) {

        LikeService.LikeResult result = likeService.like(user, bookId);

        if (result.matched()) {
            return ResponseEntity.ok(Map.of(
                    "matched", true,
                    "matchId", result.matchId(),
                    "conversationId", result.conversationId()
            ));
        }
        return ResponseEntity.ok(Map.of("matched", false));
    }

    @DeleteMapping("/{bookId}/like")
    public ResponseEntity<Void> unlike(
            @PathVariable UUID bookId,
            @AuthenticationPrincipal User user) {
        likeService.dislike(user, bookId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{bookId}/dislike")
    public ResponseEntity<Void> dislike(
            @PathVariable UUID bookId,
            @AuthenticationPrincipal User user) {
        likeService.dislike(user, bookId);
        return ResponseEntity.noContent().build();
    }
}
