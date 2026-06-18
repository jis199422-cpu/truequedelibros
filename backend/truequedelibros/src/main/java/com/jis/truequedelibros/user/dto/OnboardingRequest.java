package com.jis.truequedelibros.user.dto;

import com.jis.truequedelibros.user.domain.OnboardingIntent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OnboardingRequest {
    @NotNull(message = "El intent de onboarding es obligatorio")
    private OnboardingIntent intent;
    private String customIntent;
}
