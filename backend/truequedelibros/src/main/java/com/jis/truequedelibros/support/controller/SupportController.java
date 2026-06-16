package com.jis.truequedelibros.support.controller;

import com.jis.truequedelibros.support.dto.HomeDeliveryRequest;
import com.jis.truequedelibros.support.service.SupportService;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    @PostMapping("/home-delivery")
    public ResponseEntity<Void> requestHomeDelivery(
            @RequestBody HomeDeliveryRequest request,
            @AuthenticationPrincipal User user) {
        supportService.requestHomeDelivery(user, request.conversationId());
        return ResponseEntity.ok().build();
    }
}
