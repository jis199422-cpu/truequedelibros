package com.jis.truequedelibros.admin.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class AdminStatsResponse {
    private long totalUsers;
    private long activeUsers;
    private long bannedUsers;
    private long newUsersThisWeek;
    private long totalBooks;
    private long availableBooks;
    private long totalMatches;
}
