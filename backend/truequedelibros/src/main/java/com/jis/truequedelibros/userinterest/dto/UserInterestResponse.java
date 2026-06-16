package com.jis.truequedelibros.userinterest.dto;

import com.jis.truequedelibros.userinterest.domain.UserInterestType;

public record UserInterestResponse(UserInterestType interest, String customText) {}
