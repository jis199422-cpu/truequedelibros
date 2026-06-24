package com.jis.truequedelibros.book.service;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Holds the ranked book-id order computed for a feed "batch" so it can be paged through
 * without re-running the ranking query and without the client tracking ever-growing exclude lists.
 * In-memory and single-instance only; would need an external store if the backend scales horizontally.
 */
@Component
public class FeedBatchStore {

    private static final long BATCH_TTL_MILLIS = 60 * 60 * 1000L;

    private final Map<UUID, FeedBatch> batches = new ConcurrentHashMap<>();

    public UUID create(List<UUID> orderedBookIds) {
        evictExpired();
        UUID batchId = UUID.randomUUID();
        batches.put(batchId, new FeedBatch(orderedBookIds));
        return batchId;
    }

    public List<UUID> nextSlice(UUID batchId, int pageSize) {
        FeedBatch batch = batches.get(batchId);
        return batch == null ? List.of() : batch.takeNext(pageSize);
    }

    public boolean hasMore(UUID batchId) {
        FeedBatch batch = batches.get(batchId);
        return batch != null && batch.hasMore();
    }

    private void evictExpired() {
        long cutoff = System.currentTimeMillis() - BATCH_TTL_MILLIS;
        batches.values().removeIf(batch -> batch.createdAtMillis < cutoff);
    }

    private static final class FeedBatch {
        private final List<UUID> orderedBookIds;
        private final AtomicInteger offset = new AtomicInteger(0);
        private final long createdAtMillis = System.currentTimeMillis();

        private FeedBatch(List<UUID> orderedBookIds) {
            this.orderedBookIds = orderedBookIds;
        }

        private List<UUID> takeNext(int pageSize) {
            int size = orderedBookIds.size();
            int start = offset.getAndUpdate(o -> Math.min(o + pageSize, size));
            if (start >= size) return List.of();
            int end = Math.min(start + pageSize, size);
            return orderedBookIds.subList(start, end);
        }

        private boolean hasMore() {
            return offset.get() < orderedBookIds.size();
        }
    }
}
