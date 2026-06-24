package com.jis.truequedelibros.book.service;

import com.jis.truequedelibros.book.domain.Book;
import com.jis.truequedelibros.book.domain.BookStatus;
import com.jis.truequedelibros.book.dto.BookResponse;
import com.jis.truequedelibros.book.repository.BookRepository;
import com.jis.truequedelibros.like.repository.BookDislikeRepository;
import com.jis.truequedelibros.like.repository.BookLikeRepository;
import com.jis.truequedelibros.user.domain.OnboardingIntent;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int BATCH_SIZE = 150;
    private static final int MAX_REFILL_ATTEMPTS = 5;

    private final BookRepository bookRepository;
    private final BookService bookService;
    private final BookLikeRepository bookLikeRepository;
    private final BookDislikeRepository bookDislikeRepository;
    private final FeedBatchStore feedBatchStore;

    @Transactional(readOnly = true)
    public FeedPage getFeed(User user, UUID cursor, String genre, Double overrideLat, Double overrideLng) {
        boolean hasGenre = genre != null && !genre.isBlank();
        Double effectiveLat = overrideLat != null ? overrideLat
                : (user != null ? user.getLatitude() : null);
        Double effectiveLng = overrideLng != null ? overrideLng
                : (user != null ? user.getLongitude() : null);

        boolean filterTrueque = false;
        if (user != null) {
            filterTrueque = user.getOnboardingIntent() != OnboardingIntent.INTERCAMBIAR
                    && !bookRepository.existsByOwner_IdAndStatusAndTrueque(user.getId(), BookStatus.AVAILABLE, true);
        }

        // A cursor pointing at an exhausted (or expired/unknown) batch must fall back to a fresh
        // batch rather than returning an empty page forever — the client retries with the same
        // cursor once its queue empties (see FeedPage.jsx's force-reload effect), and a fresh
        // batch also naturally picks up books uploaded since the previous batch was computed.
        UUID batchId = (cursor != null && feedBatchStore.hasMore(cursor))
                ? cursor
                : createBatch(user, hasGenre, genre, effectiveLat, effectiveLng, filterTrueque);

        UUID userId = user != null ? user.getId() : null;
        List<Book> books = resolveValidPage(batchId, userId, DEFAULT_PAGE_SIZE);

        List<BookResponse> bookResponses = books.stream()
                .map(b -> {
                    Double dist = null;
                    if (effectiveLat != null && effectiveLng != null
                            && b.getOwner().getLatitude() != null
                            && b.getOwner().getLongitude() != null) {
                        dist = haversineKm(effectiveLat, effectiveLng,
                                b.getOwner().getLatitude(), b.getOwner().getLongitude());
                    }
                    return bookService.toResponse(b, dist);
                })
                .toList();

        long truequeOnlyCount = (user != null && filterTrueque)
                ? bookRepository.countFeedTruequeOnly(user.getId())
                : 0;

        return new FeedPage(bookResponses, feedBatchStore.hasMore(batchId), truequeOnlyCount, batchId);
    }

    private UUID createBatch(User user, boolean hasGenre, String genre,
                              Double effectiveLat, Double effectiveLng, boolean filterTrueque) {
        PageRequest pageable = PageRequest.of(0, BATCH_SIZE);
        Page<Book> result;

        if (user == null) {
            if (effectiveLat != null && effectiveLng != null) {
                result = hasGenre
                        ? bookRepository.findFeedGuestByProximityAndGenre(effectiveLat, effectiveLng, genre, pageable)
                        : bookRepository.findFeedGuestByProximity(effectiveLat, effectiveLng, pageable);
            } else {
                result = hasGenre
                        ? bookRepository.findFeedGuestAndGenre(genre, pageable)
                        : bookRepository.findFeedGuest(pageable);
            }
        } else if (effectiveLat != null && effectiveLng != null) {
            result = filterTrueque
                    ? (hasGenre
                        ? bookRepository.findFeedByProximityAndGenreNoTrueque(
                                user.getId(), effectiveLat, effectiveLng, genre, pageable)
                        : bookRepository.findFeedByProximityNoTrueque(
                                user.getId(), effectiveLat, effectiveLng, pageable))
                    : (hasGenre
                        ? bookRepository.findFeedByProximityAndGenre(
                                user.getId(), effectiveLat, effectiveLng, genre, pageable)
                        : bookRepository.findFeedByProximity(
                                user.getId(), effectiveLat, effectiveLng, pageable));
        } else {
            result = filterTrueque
                    ? (hasGenre
                        ? bookRepository.findFeedBasicAndGenreNoTrueque(user.getId(), genre, pageable)
                        : bookRepository.findFeedBasicNoTrueque(user.getId(), pageable))
                    : (hasGenre
                        ? bookRepository.findFeedBasicAndGenre(user.getId(), genre, pageable)
                        : bookRepository.findFeedBasic(user.getId(), pageable));
        }

        List<UUID> orderedIds = result.getContent().stream().map(Book::getId).toList();
        return feedBatchStore.create(orderedIds);
    }

    /**
     * Pulls book ids off the batch and re-validates them (still AVAILABLE, not liked/disliked
     * since the batch was computed), topping up from the batch until {@code pageSize} valid
     * books are collected or the batch runs out.
     */
    private List<Book> resolveValidPage(UUID batchId, UUID userId, int pageSize) {
        List<Book> page = new ArrayList<>();
        for (int attempt = 0; page.size() < pageSize && attempt < MAX_REFILL_ATTEMPTS; attempt++) {
            List<UUID> slice = feedBatchStore.nextSlice(batchId, pageSize - page.size());
            if (slice.isEmpty()) break;
            page.addAll(filterValid(slice, userId));
        }
        return page;
    }

    private List<Book> filterValid(List<UUID> ids, UUID userId) {
        Map<UUID, Book> byId = bookRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Book::getId, b -> b));
        Set<UUID> excluded = userId == null ? Set.of() : excludedIds(userId, ids);
        return ids.stream()
                .map(byId::get)
                .filter(Objects::nonNull)
                .filter(b -> b.getStatus() == BookStatus.AVAILABLE)
                .filter(b -> !excluded.contains(b.getId()))
                .toList();
    }

    private Set<UUID> excludedIds(UUID userId, List<UUID> ids) {
        Set<UUID> excluded = new HashSet<>(bookLikeRepository.findLikedBookIds(userId, ids));
        excluded.addAll(bookDislikeRepository.findDislikedBookIds(userId, ids));
        return excluded;
    }

    private static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public record FeedPage(List<BookResponse> books, boolean hasMore, long truequeOnlyCount, UUID cursor) {}
}
