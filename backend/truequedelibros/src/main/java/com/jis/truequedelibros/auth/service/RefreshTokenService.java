package com.jis.truequedelibros.auth.service;

import com.jis.truequedelibros.auth.domain.RefreshToken;
import com.jis.truequedelibros.auth.repository.RefreshTokenRepository;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.refresh-token.expiration-days}")
    private long expirationDays;

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser_Id(user.getId());

        long days = user.getRole() == com.jis.truequedelibros.user.domain.Role.LOCAL
                ? 30L : expirationDays;
        return refreshTokenRepository.save(RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(LocalDateTime.now().plusDays(days))
                .build());
    }

    @Transactional
    public RefreshToken validateAndGet(String tokenValue) {
        RefreshToken token = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new AppException("Token de refresco inválido", HttpStatus.UNAUTHORIZED));

        if (token.isExpired()) {
            refreshTokenRepository.delete(token);
            throw new AppException("Sesión expirada. Por favor inicia sesión nuevamente.", HttpStatus.UNAUTHORIZED);
        }

        return token;
    }

    @Transactional
    public void deleteByUserId(UUID userId) {
        refreshTokenRepository.deleteByUser_Id(userId);
    }
}
