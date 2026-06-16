package com.jis.truequedelibros.beneficio.repository;

import com.jis.truequedelibros.beneficio.domain.CuponAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface CuponAttemptRepository extends JpaRepository<CuponAttempt, UUID> {

    Optional<CuponAttempt> findByUserIdAndLocal_Id(UUID userId, UUID localId);

    void deleteByLastAttemptAtBefore(LocalDateTime cutoff);
}
