package com.jis.truequedelibros.readingplan.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class ReadingPlanResponse {

    private UUID id;
    private String description;
    private int maxParticipants;
    private int currentParticipants;
    private String contactPhone;
    private String organizerName;
    private String organizerAvatarUrl;
    private boolean organizer;
    private boolean participant;
    private boolean full;
    private LocalDateTime createdAt;
}
