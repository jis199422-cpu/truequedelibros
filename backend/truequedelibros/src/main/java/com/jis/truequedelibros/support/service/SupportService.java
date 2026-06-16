package com.jis.truequedelibros.support.service;

import com.jis.truequedelibros.auth.service.EmailService;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupportService {

    private final EmailService emailService;

    public void requestHomeDelivery(User user, UUID conversationId) {
        emailService.sendHomeDeliveryRequest(user, conversationId);
    }
}
