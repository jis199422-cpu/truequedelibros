package com.jis.truequedelibros.userinterest.repository;

import com.jis.truequedelibros.userinterest.domain.UserInterest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserInterestRepository extends JpaRepository<UserInterest, UUID> {

    List<UserInterest> findByUser_Id(UUID userId);

    void deleteByUser_Id(UUID userId);
}
