package com.jis.truequedelibros.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jis.truequedelibros.analytics.domain.ProductEvent;
import com.jis.truequedelibros.analytics.repository.ProductEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductEventService {

    public static final String FIRST_BOOK_UPLOADED = "FIRST_BOOK_UPLOADED";

    private final ProductEventRepository productEventRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void record(UUID userId, String eventName, Map<String, Object> metadata) {
        String metaJson = null;
        if (metadata != null && !metadata.isEmpty()) {
            try {
                metaJson = objectMapper.writeValueAsString(metadata);
            } catch (Exception e) {
                log.warn("Could not serialize event metadata for event {}", eventName, e);
            }
        }
        productEventRepository.save(ProductEvent.builder()
                .userId(userId)
                .eventName(eventName)
                .metadata(metaJson)
                .build());
    }

    @Transactional(readOnly = true)
    public boolean hasRecordedFirstBook(UUID userId) {
        return productEventRepository.countByEventNameAndUserId(FIRST_BOOK_UPLOADED, userId) > 0;
    }
}
