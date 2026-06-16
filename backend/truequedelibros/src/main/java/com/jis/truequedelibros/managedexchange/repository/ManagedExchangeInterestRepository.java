package com.jis.truequedelibros.managedexchange.repository;

import com.jis.truequedelibros.managedexchange.domain.ManagedExchangeInterest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ManagedExchangeInterestRepository extends JpaRepository<ManagedExchangeInterest, UUID> {

    boolean existsByUser_IdAndConversationId(UUID userId, UUID conversationId);

    boolean existsByUser_IdAndConversationIdIsNull(UUID userId);
}
