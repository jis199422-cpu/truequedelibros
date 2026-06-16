package com.jis.truequedelibros.like.controller;

import com.jis.truequedelibros.like.dto.DailyLikeStatusResponse;
import com.jis.truequedelibros.like.service.LikeService;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/likes")
@RequiredArgsConstructor
public class LikesController {

    private final LikeService likeService;

    @GetMapping("/daily-status")
    public ResponseEntity<DailyLikeStatusResponse> getDailyStatus(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(likeService.getDailyLikeStatus(user));
    }

    @GetMapping("/received")
    public ResponseEntity<LikeService.LikesPage> getReceivedLikes(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(likeService.getPendingLikesReceived(user, page));
    }
}
