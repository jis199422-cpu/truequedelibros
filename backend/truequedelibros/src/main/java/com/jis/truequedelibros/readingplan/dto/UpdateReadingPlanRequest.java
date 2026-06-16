package com.jis.truequedelibros.readingplan.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateReadingPlanRequest {

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 300, message = "La descripción no puede superar los 300 caracteres")
    private String description;

    @Min(value = 3, message = "El mínimo de participantes es 3")
    private int maxParticipants;

    @NotBlank(message = "El teléfono de contacto es obligatorio")
    @Size(max = 20, message = "El teléfono no puede superar los 20 caracteres")
    private String contactPhone;
}
