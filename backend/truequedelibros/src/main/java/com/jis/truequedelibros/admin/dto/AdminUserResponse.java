package com.jis.truequedelibros.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
@Getter
public class AdminUserResponse {
    private UUID id;
    private String name;
    private String email;
    private String role;
    private boolean active;
    private boolean emailVerified;
    private long bookCount;
    private LocalDateTime createdAt;
}
