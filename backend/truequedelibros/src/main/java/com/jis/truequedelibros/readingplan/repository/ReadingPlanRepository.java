package com.jis.truequedelibros.readingplan.repository;

import com.jis.truequedelibros.readingplan.domain.ReadingPlan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReadingPlanRepository extends JpaRepository<ReadingPlan, UUID> {

    Page<ReadingPlan> findByActiveTrueOrderByCreatedAtDesc(Pageable pageable);

    boolean existsByOrganizer_IdAndActiveTrue(UUID organizerId);
}
