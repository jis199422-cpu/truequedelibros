package com.jis.truequedelibros.managedexchange.controller;

import com.jis.truequedelibros.managedexchange.dto.ManagedExchangeInterestRequest;
import com.jis.truequedelibros.managedexchange.service.ManagedExchangeService;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/managed-exchange")
@RequiredArgsConstructor
public class ManagedExchangeController {

    private final ManagedExchangeService managedExchangeService;

    @PostMapping("/interest")
    public ResponseEntity<Void> registerInterest(
            @RequestBody ManagedExchangeInterestRequest request,
            @AuthenticationPrincipal User user) {
        managedExchangeService.registerInterest(user, request.conversationId());
        return ResponseEntity.noContent().build();
    }
}
