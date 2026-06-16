package com.jis.truequedelibros.userinterest.dto;

import com.jis.truequedelibros.userinterest.domain.UserInterestType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InterestItemRequest(
        @NotNull UserInterestType interest,
        @Size(max = 255) String customText
) {}
