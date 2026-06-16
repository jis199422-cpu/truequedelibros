package com.jis.truequedelibros.beneficio.repository;

import com.jis.truequedelibros.beneficio.domain.Promocion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PromocionRepository extends JpaRepository<Promocion, UUID> {

    List<Promocion> findByLocal_IdAndActiveTrueOrderByCreatedAtAsc(UUID localId);

    Optional<Promocion> findByIdAndLocal_Id(UUID id, UUID localId);
}
