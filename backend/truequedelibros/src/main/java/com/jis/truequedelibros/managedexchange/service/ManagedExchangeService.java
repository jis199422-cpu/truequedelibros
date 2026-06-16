package com.jis.truequedelibros.managedexchange.service;

import com.jis.truequedelibros.managedexchange.domain.ManagedExchangeInterest;
import com.jis.truequedelibros.managedexchange.repository.ManagedExchangeInterestRepository;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ManagedExchangeService {

    private final ManagedExchangeInterestRepository repository;

    @Transactional
    public void registerInterest(User user, UUID conversationId) {
        boolean alreadyRegistered = conversationId != null
                ? repository.existsByUser_IdAndConversationId(user.getId(), conversationId)
                : repository.existsByUser_IdAndConversationIdIsNull(user.getId());

        if (alreadyRegistered) return;

        repository.save(ManagedExchangeInterest.builder()
                .user(user)
                .conversationId(conversationId)
                .build());
    }
}
