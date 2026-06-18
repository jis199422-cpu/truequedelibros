package com.jis.truequedelibros.user.repository;

import com.jis.truequedelibros.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    List<User> findAllByOrderByCreatedAtDesc();
    long countByActiveFalse();
    long countByCreatedAtAfter(LocalDateTime since);
    long countByEmailVerifiedTrue();
    long countByOnboardingCompletedTrue();

    @org.springframework.data.jpa.repository.Query(
            value = "SELECT COUNT(*) FROM users WHERE onboarding_intent = :intent",
            nativeQuery = true)
    long countByOnboardingIntent(@org.springframework.data.repository.query.Param("intent") String intent);
}
