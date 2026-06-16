package com.jis.truequedelibros.match.repository;

import com.jis.truequedelibros.match.domain.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MatchRepository extends JpaRepository<Match, UUID> {

    @Query("SELECT m FROM Match m WHERE m.userA.id = :userId OR m.userB.id = :userId ORDER BY m.createdAt DESC")
    List<Match> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(m) > 0 FROM Match m WHERE m.bookA.id = :bookId OR m.bookB.id = :bookId")
    boolean existsByBookId(@Param("bookId") UUID bookId);
}
