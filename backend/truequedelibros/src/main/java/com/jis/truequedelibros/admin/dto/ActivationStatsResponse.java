package com.jis.truequedelibros.admin.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ActivationStatsResponse {
    private long registeredUsers;
    private long onboardingCompleted;
    private long intentIntercambiar;
    private long intentVender;
    private long intentComprar;
    private long firstBookUploaded;
    private double conversionRate;
    private Double avgMinutesToFirstBook;
}
