package com.jis.truequedelibros.userinterest.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record SaveInterestsRequest(
        @NotEmpty(message = "Debes seleccionar al menos un interés")
        @Valid
        List<InterestItemRequest> interests
) {}
