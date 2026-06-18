package com.jis.truequedelibros.auth.dto;

import com.jis.truequedelibros.user.domain.Role;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String name;
    private String email;
    private String city;
    private Double latitude;
    private Double longitude;
    private String profilePictureUrl;
    private Role role;
    private boolean emailVerified;
    private boolean premium;
    private boolean onboardingCompleted;
    private String onboardingIntent;
    private boolean hasBooks;
}
