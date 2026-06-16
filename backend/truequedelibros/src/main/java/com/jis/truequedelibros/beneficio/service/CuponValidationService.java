package com.jis.truequedelibros.beneficio.service;

import com.jis.truequedelibros.beneficio.domain.CuponAttempt;
import com.jis.truequedelibros.beneficio.domain.CuponStatus;
import com.jis.truequedelibros.beneficio.domain.Local;
import com.jis.truequedelibros.beneficio.dto.ValidarCuponRequest;
import com.jis.truequedelibros.beneficio.dto.ValidarCuponResponse;
import com.jis.truequedelibros.beneficio.repository.CuponAttemptRepository;
import com.jis.truequedelibros.beneficio.repository.CuponRepository;
import com.jis.truequedelibros.beneficio.repository.LocalRepository;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CuponValidationService {

    private static final int MAX_FAILED  = 15;
    private static final int WINDOW_MIN  = 10;
    private static final int BAN_MIN     = 30;

    private final CuponRepository cuponRepository;
    private final CuponAttemptRepository attemptRepository;
    private final LocalRepository localRepository;

    public ValidarCuponResponse validarCupon(User localUser, UUID localId,
                                              ValidarCuponRequest request,
                                              HttpServletRequest httpRequest) {
        Local local = localRepository.findByIdAndOwner_Id(localId, localUser.getId())
                .orElseThrow(() -> new AppException(
                        "No tenés permiso para acceder a este local", HttpStatus.FORBIDDEN));

        CuponAttempt attempt = getOrCreateAttempt(localUser.getId(),
                httpRequest.getRemoteAddr(), local);

        checkBan(attempt);

        String code = request.code().toUpperCase();
        var cuponOpt = cuponRepository.findByCode(code);

        if (cuponOpt.isEmpty()
                || !cuponOpt.get().getLocal().getId().equals(localId)
                || cuponOpt.get().getStatus() != CuponStatus.PENDIENTE) {
            recordFailure(attempt);
            return new ValidarCuponResponse(false, "Código inválido", null, null);
        }

        var cupon = cuponOpt.get();

        if (cupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            cupon.setStatus(CuponStatus.EXPIRADO);
            cuponRepository.save(cupon);
            recordFailure(attempt);
            return new ValidarCuponResponse(false, "Cupón expirado", null, null);
        }

        cupon.setStatus(CuponStatus.VALIDADO);
        cupon.setValidatedAt(LocalDateTime.now());
        cupon.setValidatedByUserId(localUser.getId());
        cuponRepository.save(cupon);

        resetAttempt(attempt);

        return new ValidarCuponResponse(
                true,
                "Cupón validado exitosamente",
                cupon.getUser().getName(),
                cupon.getPromocion().getDescription()
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private CuponAttempt getOrCreateAttempt(UUID userId, String ip, Local local) {
        return attemptRepository.findByUserIdAndLocal_Id(userId, local.getId())
                .orElseGet(() -> CuponAttempt.builder()
                        .userId(userId)
                        .ipAddress(ip)
                        .local(local)
                        .failedAttempts(0)
                        .lastAttemptAt(LocalDateTime.now())
                        .build());
    }

    private void checkBan(CuponAttempt attempt) {
        if (attempt.getBannedUntil() != null
                && LocalDateTime.now().isBefore(attempt.getBannedUntil())) {
            throw new AppException(
                    "Cuenta temporalmente bloqueada. Intentá nuevamente más tarde.",
                    HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    private void recordFailure(CuponAttempt attempt) {
        LocalDateTime now = LocalDateTime.now();
        if (attempt.getLastAttemptAt().isBefore(now.minusMinutes(WINDOW_MIN))) {
            attempt.setFailedAttempts(1);
        } else {
            attempt.setFailedAttempts(attempt.getFailedAttempts() + 1);
        }
        attempt.setLastAttemptAt(now);
        if (attempt.getFailedAttempts() >= MAX_FAILED) {
            attempt.setBannedUntil(now.plusMinutes(BAN_MIN));
        }
        attemptRepository.save(attempt);
    }

    private void resetAttempt(CuponAttempt attempt) {
        attempt.setFailedAttempts(0);
        attempt.setBannedUntil(null);
        attemptRepository.save(attempt);
    }
}
