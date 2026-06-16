package com.jis.truequedelibros.userinterest.service;

import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.User;
import com.jis.truequedelibros.user.repository.UserRepository;
import com.jis.truequedelibros.userinterest.domain.UserInterest;
import com.jis.truequedelibros.userinterest.dto.SaveInterestsRequest;
import com.jis.truequedelibros.userinterest.dto.UserInterestResponse;
import com.jis.truequedelibros.userinterest.repository.UserInterestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserInterestService {

    private final UserInterestRepository userInterestRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserInterestResponse> getInterests(UUID userId) {
        return userInterestRepository.findByUser_Id(userId)
                .stream()
                .map(ui -> new UserInterestResponse(ui.getInterest(), ui.getCustomText()))
                .toList();
    }

    @Transactional
    public void saveInterests(UUID userId, SaveInterestsRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("Usuario no encontrado", HttpStatus.NOT_FOUND));

        userInterestRepository.deleteByUser_Id(userId);

        List<UserInterest> entities = request.interests().stream()
                .map(item -> UserInterest.builder()
                        .user(user)
                        .interest(item.interest())
                        .customText(item.customText())
                        .build())
                .toList();

        userInterestRepository.saveAll(entities);
    }
}
