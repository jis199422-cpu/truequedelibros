package com.jis.truequedelibros.readingplan.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ReadingPlansPageResponse {

    private List<ReadingPlanResponse> plans;
    private boolean hasMore;
    private long totalElements;
    private int page;
}
