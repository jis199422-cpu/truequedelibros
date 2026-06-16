package com.jis.truequedelibros.like.dto;

public record DailyLikeStatusResponse(long dailyCount, long dailyLimit, boolean isPremium, String resetAt, boolean hasBooks) {}
