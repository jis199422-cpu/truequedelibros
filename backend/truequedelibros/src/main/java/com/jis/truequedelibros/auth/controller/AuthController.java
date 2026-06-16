package com.jis.truequedelibros.auth.controller;

import com.jis.truequedelibros.auth.dto.ForgotPasswordRequest;
import com.jis.truequedelibros.auth.dto.LoginRequest;
import com.jis.truequedelibros.auth.dto.RegisterRequest;
import com.jis.truequedelibros.auth.dto.ResetPasswordRequest;
import com.jis.truequedelibros.auth.service.AuthService;
import com.jis.truequedelibros.shared.exception.AppException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;

    @Value("${app.refresh-token.expiration-days}")
    private long refreshTokenExpirationDays;

    @Value("${app.secure-cookies}")
    private boolean secureCookies;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Registro exitoso. Revisa tu correo para verificar tu cuenta."));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message", "Cuenta verificada exitosamente. Ya puedes iniciar sesión."));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request,
                                                      HttpServletResponse response) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        AuthService.LoginResult result = authService.login(request);
        Duration cookieAge = Duration.ofDays(refreshTokenExpirationDays);
        response.addHeader("Set-Cookie", buildRefreshTokenCookie(result.refreshToken(), cookieAge).toString());

        return ResponseEntity.ok(Map.of(
                "accessToken", result.accessToken(),
                "user", result.user()
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractRefreshTokenCookie(request)
                .orElseThrow(() -> new AppException("Token de refresco no encontrado", HttpStatus.UNAUTHORIZED));

        AuthService.LoginResult result = authService.refresh(refreshToken);
        response.addHeader("Set-Cookie", buildRefreshTokenCookie(result.refreshToken()).toString());
        return ResponseEntity.ok(Map.of(
                "accessToken", result.accessToken(),
                "user", result.user()
        ));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "Si el email está registrado, recibirás un enlace para restablecer tu contraseña."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Contraseña restablecida exitosamente."));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(extractRefreshTokenCookie(request).orElse(null));
        response.addHeader("Set-Cookie", clearRefreshTokenCookie().toString());
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada exitosamente."));
    }

    private ResponseCookie buildRefreshTokenCookie(String token) {
        return buildRefreshTokenCookie(token, Duration.ofDays(refreshTokenExpirationDays));
    }

    private ResponseCookie buildRefreshTokenCookie(String token, Duration maxAge) {
        return ResponseCookie.from("refresh_token", token)
                .httpOnly(true)
                .secure(secureCookies)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();
    }

    private ResponseCookie clearRefreshTokenCookie() {
        return ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(secureCookies)
                .path("/")
                .maxAge(Duration.ZERO)
                .sameSite("Lax")
                .build();
    }

    private Optional<String> extractRefreshTokenCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return Optional.empty();
        return Arrays.stream(request.getCookies())
                .filter(c -> "refresh_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }
}
