package com.jis.truequedelibros.beneficio.repository;

import com.jis.truequedelibros.beneficio.domain.Local;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LocalRepository extends JpaRepository<Local, UUID> {

    List<Local> findByActiveTrueOrderByNameAsc();

    Optional<Local> findByIdAndOwner_Id(UUID id, UUID ownerId);
}
