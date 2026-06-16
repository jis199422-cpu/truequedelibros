package com.jis.truequedelibros.beneficio.repository;

import com.jis.truequedelibros.beneficio.domain.Cupon;
import com.jis.truequedelibros.beneficio.domain.CuponStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CuponRepository extends JpaRepository<Cupon, UUID> {

    Optional<Cupon> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByUser_IdAndLocal_IdAndStatus(UUID userId, UUID localId, CuponStatus status);

    Optional<Cupon> findByUser_IdAndLocal_IdAndStatus(UUID userId, UUID localId, CuponStatus status);

    List<Cupon> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    Page<Cupon> findByLocal_IdAndStatusOrderByValidatedAtDesc(
            UUID localId, CuponStatus status, Pageable pageable);

    @Query("SELECT c FROM Cupon c WHERE c.status = 'PENDIENTE' AND c.expiresAt < :now")
    List<Cupon> findExpiredPendiente(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(c) FROM Cupon c WHERE c.local.id = :localId AND c.status = 'VALIDADO' " +
           "AND cast(c.validatedAt as LocalDate) = :day")
    long countValidatedByLocalAndDay(@Param("localId") UUID localId, @Param("day") LocalDate day);

    @Query("SELECT COUNT(c) FROM Cupon c WHERE c.local.id = :localId AND c.status = 'VALIDADO' " +
           "AND extract(year from c.validatedAt) = :year AND extract(month from c.validatedAt) = :month")
    long countValidatedByLocalAndMonth(@Param("localId") UUID localId,
                                       @Param("year") int year,
                                       @Param("month") int month);

    long countByLocal_IdAndStatus(UUID localId, CuponStatus status);
}
