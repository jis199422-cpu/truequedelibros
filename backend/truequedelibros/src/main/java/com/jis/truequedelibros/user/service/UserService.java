package com.jis.truequedelibros.user.service;

import com.jis.truequedelibros.auth.dto.UserResponse;
import com.jis.truequedelibros.auth.service.AuthService;
import com.jis.truequedelibros.book.service.BookService;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.OnboardingIntent;
import com.jis.truequedelibros.user.domain.User;
import com.jis.truequedelibros.user.dto.LocationRequest;
import com.jis.truequedelibros.user.dto.PublicProfileResponse;
import com.jis.truequedelibros.user.dto.UpdateUserRequest;
import com.jis.truequedelibros.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BookService bookService;
    private final GeocodingService geocodingService;
    private final AuthService authService;

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateUserRequest request) {
        User user = findById(userId);

        if (request.getName() != null && !request.getName().isBlank()) user.setName(request.getName());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getProfilePictureUrl() != null) user.setProfilePictureUrl(request.getProfilePictureUrl());

        userRepository.save(user);
        return authService.toUserResponse(user);
    }

    @Transactional
    public void updateLocation(UUID userId, LocationRequest request) {
        User user = findById(userId);
        double lat = Math.round(request.getLatitude() * 100.0) / 100.0;
        double lng = Math.round(request.getLongitude() * 100.0) / 100.0;
        user.setLatitude(lat);
        user.setLongitude(lng);
        String city = geocodingService.reverseGeocode(lat, lng);
        if (city != null) user.setCity(city);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public PublicProfileResponse getPublicProfile(UUID userId, UUID requesterId) {
        User user = findById(userId);
        return PublicProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .bio(user.getBio())
                .city(user.getCity())
                .profilePictureUrl(user.getProfilePictureUrl())
                .books(bookService.getByOwner(userId, requesterId))
                .premium(user.isPremium())
                .build();
    }

    @Transactional
    public void saveSubscriptionInterest(UUID userId, boolean interested) {
        User user = findById(userId);
        user.setSubscriptionInterest(interested);
        userRepository.save(user);
    }

    @Transactional
    public UserResponse saveOnboarding(UUID userId, OnboardingIntent intent, String customIntent) {
        if (intent == OnboardingIntent.OTRO && (customIntent == null || customIntent.isBlank())) {
            throw new AppException("Describí tu objetivo para continuar", HttpStatus.BAD_REQUEST);
        }
        User user = findById(userId);
        user.setOnboardingCompleted(true);
        user.setOnboardingIntent(intent);
        if (intent == OnboardingIntent.OTRO) user.setOnboardingNotes(customIntent.trim());
        userRepository.save(user);
        return authService.toUserResponse(user);
    }

    private User findById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException("Usuario no encontrado", HttpStatus.NOT_FOUND));
    }
}
