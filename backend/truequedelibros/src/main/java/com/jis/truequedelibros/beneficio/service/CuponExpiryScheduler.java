package com.jis.truequedelibros.beneficio.service;

import com.jis.truequedelibros.beneficio.domain.CuponStatus;
import com.jis.truequedelibros.beneficio.repository.CuponAttemptRepository;
import com.jis.truequedelibros.beneficio.repository.CuponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class CuponExpiryScheduler {

    private final CuponRepository cuponRepository;
    private final CuponAttemptRepository cuponAttemptRepository;

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void expireCupones() {
        var expired = cuponRepository.findExpiredPendiente(LocalDateTime.now());
        expired.forEach(c -> c.setStatus(CuponStatus.EXPIRADO));
        cuponRepository.saveAll(expired);
    }

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanOldAttempts() {
        cuponAttemptRepository.deleteByLastAttemptAtBefore(LocalDateTime.now().minusDays(7));
    }
}
