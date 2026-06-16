package com.jis.truequedelibros.userinterest.controller;

import com.jis.truequedelibros.user.domain.User;
import com.jis.truequedelibros.userinterest.dto.SaveInterestsRequest;
import com.jis.truequedelibros.userinterest.dto.UserInterestResponse;
import com.jis.truequedelibros.userinterest.service.UserInterestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/me/interests")
@RequiredArgsConstructor
public class UserInterestController {

    private final UserInterestService userInterestService;

    @GetMapping
    public ResponseEntity<List<UserInterestResponse>> getInterests(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userInterestService.getInterests(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Void> saveInterests(
            @Valid @RequestBody SaveInterestsRequest request,
            @AuthenticationPrincipal User user) {
        userInterestService.saveInterests(user.getId(), request);
        return ResponseEntity.noContent().build();
    }
}
