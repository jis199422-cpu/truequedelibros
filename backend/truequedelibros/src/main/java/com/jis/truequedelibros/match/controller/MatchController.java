package com.jis.truequedelibros.match.controller;

import com.jis.truequedelibros.match.dto.MatchResponse;
import com.jis.truequedelibros.match.service.MatchService;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @GetMapping
    public ResponseEntity<List<MatchResponse>> getMatches(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(matchService.getMatches(user));
    }
}
