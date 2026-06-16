package com.jis.truequedelibros.auth.service;

import com.jis.truequedelibros.auth.domain.EmailVerificationToken;
import com.jis.truequedelibros.auth.domain.PasswordResetToken;
import com.jis.truequedelibros.auth.domain.RefreshToken;
import com.jis.truequedelibros.auth.dto.LoginRequest;
import com.jis.truequedelibros.auth.dto.RegisterRequest;
import com.jis.truequedelibros.auth.dto.UserResponse;
import com.jis.truequedelibros.auth.repository.EmailVerificationTokenRepository;
import com.jis.truequedelibros.auth.repository.PasswordResetTokenRepository;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.Role;
import com.jis.truequedelibros.user.domain.User;
import com.jis.truequedelibros.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;

    @Value("${app.email-verification.expiration-hours}")
    private long verificationExpirationHours;

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException("El email ya está registrado", HttpStatus.CONFLICT);
        }

        User user = userRepository.save(User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build());

        sendVerificationEmail(user);
    }

    @Transactional
    public void verifyEmail(String tokenValue) {
        EmailVerificationToken token = verificationTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new AppException("Token de verificación inválido", HttpStatus.BAD_REQUEST));

        if (token.isExpired()) {
            verificationTokenRepository.delete(token);
            throw new AppException("El enlace de verificación ha expirado. Solicita uno nuevo.", HttpStatus.BAD_REQUEST);
        }

        User user = token.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        verificationTokenRepository.delete(token);
        emailService.sendWelcomeOnboardingEmail(user.getEmail(), user.getName());
    }

    @Transactional
    public LoginResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException("Usuario no encontrado", HttpStatus.NOT_FOUND));
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        return buildLoginResult(user);
    }

    public LoginResult refresh(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenService.validateAndGet(refreshTokenValue);
        return buildLoginResult(refreshToken.getUser());
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        if (refreshTokenValue == null) return;
        RefreshToken token = refreshTokenService.validateAndGet(refreshTokenValue);
        refreshTokenService.deleteByUserId(token.getUser().getId());
    }

    @Transactional
    public OAuth2LoginResult loginOrRegisterOAuth2User(String email, String googleId, String name, String pictureUrl) {
        boolean[] isNewUser = { false };
        User user = userRepository.findByEmail(email).map(existing -> {
            if (existing.getGoogleId() == null) {
                existing.setGoogleId(googleId);
                return userRepository.save(existing);
            }
            return existing;
        }).orElseGet(() -> {
            isNewUser[0] = true;
            return userRepository.save(User.builder()
                    .email(email)
                    .googleId(googleId)
                    .name(name)
                    .profilePictureUrl(pictureUrl)
                    .role(Role.USER)
                    .emailVerified(true)
                    .build());
        });

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        return new OAuth2LoginResult(buildLoginResult(user), isNewUser[0]);
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .city(user.getCity())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .profilePictureUrl(user.getProfilePictureUrl())
                .role(user.getRole())
                .emailVerified(user.isEmailVerified())
                .premium(user.isPremium())
.build();
    }

    private LoginResult buildLoginResult(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        return new LoginResult(accessToken, refreshToken.getToken(), toUserResponse(user));
    }

    @Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            resetTokenRepository.deleteByUser_Id(user.getId());
            PasswordResetToken token = resetTokenRepository.save(
                    PasswordResetToken.builder()
                            .token(UUID.randomUUID().toString())
                            .user(user)
                            .expiresAt(LocalDateTime.now().plusHours(1))
                            .build());
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), token.getToken());
        });
    }

    @Transactional
    public void resetPassword(String tokenValue, String newPassword) {
        PasswordResetToken token = resetTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new AppException("Token inválido o expirado", HttpStatus.BAD_REQUEST));

        if (token.isExpired()) {
            resetTokenRepository.delete(token);
            throw new AppException("El enlace ha expirado. Solicita uno nuevo.", HttpStatus.BAD_REQUEST);
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        resetTokenRepository.delete(token);
    }

    private void sendVerificationEmail(User user) {
        verificationTokenRepository.deleteByUser_Id(user.getId());

        EmailVerificationToken token = verificationTokenRepository.save(
                EmailVerificationToken.builder()
                        .token(UUID.randomUUID().toString())
                        .user(user)
                        .expiresAt(LocalDateTime.now().plusHours(verificationExpirationHours))
                        .build());

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), token.getToken());
    }

    public record LoginResult(String accessToken, String refreshToken, UserResponse user) {}

    public record OAuth2LoginResult(LoginResult loginResult, boolean isNewUser) {}
}
