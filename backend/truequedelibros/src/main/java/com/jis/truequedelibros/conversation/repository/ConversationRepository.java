package com.jis.truequedelibros.conversation.repository;

import com.jis.truequedelibros.conversation.domain.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Optional<Conversation> findByUserA_IdAndUserB_Id(UUID userAId, UUID userBId);

    @Query("SELECT c FROM Conversation c WHERE c.userA.id = :userId OR c.userB.id = :userId ORDER BY c.updatedAt DESC")
    List<Conversation> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT CASE WHEN c.userA.id = :userId THEN c.userB.email ELSE c.userA.email END FROM Conversation c WHERE c.userA.id = :userId OR c.userB.id = :userId")
    List<String> findPartnerEmailsByUserId(@Param("userId") UUID userId);
}
