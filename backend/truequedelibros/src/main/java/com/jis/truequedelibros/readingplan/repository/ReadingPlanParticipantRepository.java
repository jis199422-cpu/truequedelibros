package com.jis.truequedelibros.readingplan.repository;

import com.jis.truequedelibros.readingplan.domain.ReadingPlanParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReadingPlanParticipantRepository extends JpaRepository<ReadingPlanParticipant, UUID> {

    boolean existsByPlan_IdAndUser_Id(UUID planId, UUID userId);

    int countByPlan_Id(UUID planId);

    List<ReadingPlanParticipant> findByPlan_Id(UUID planId);

    Optional<ReadingPlanParticipant> findByPlan_IdAndUser_Id(UUID planId, UUID userId);
}
