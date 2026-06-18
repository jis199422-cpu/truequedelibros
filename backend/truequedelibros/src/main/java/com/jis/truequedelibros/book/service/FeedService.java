package com.jis.truequedelibros.book.service;

import com.jis.truequedelibros.book.domain.BookStatus;
import com.jis.truequedelibros.book.dto.BookResponse;
import com.jis.truequedelibros.book.repository.BookRepository;
import com.jis.truequedelibros.user.domain.OnboardingIntent;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeedService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final UUID NO_EXCLUSIONS_SENTINEL = new UUID(0L, 0L);

    private final BookRepository bookRepository;
    private final BookService bookService;

    @Transactional(readOnly = true)
    public FeedPage getFeed(User user, List<UUID> excludeIds, String genre, Double overrideLat, Double overrideLng) {
        PageRequest pageable = PageRequest.of(0, DEFAULT_PAGE_SIZE);
        List<UUID> exclusions = (excludeIds == null || excludeIds.isEmpty())
                ? List.of(NO_EXCLUSIONS_SENTINEL)
                : excludeIds;
        boolean hasGenre = genre != null && !genre.isBlank();

        Double effectiveLat = overrideLat != null ? overrideLat
                : (user != null ? user.getLatitude() : null);
        Double effectiveLng = overrideLng != null ? overrideLng
                : (user != null ? user.getLongitude() : null);

        Page<com.jis.truequedelibros.book.domain.Book> result;
        boolean filterTrueque = false;

        if (user == null) {
            if (effectiveLat != null && effectiveLng != null) {
                result = hasGenre
                        ? bookRepository.findFeedGuestByProximityAndGenre(effectiveLat, effectiveLng, genre, exclusions, pageable)
                        : bookRepository.findFeedGuestByProximity(effectiveLat, effectiveLng, exclusions, pageable);
            } else {
                result = hasGenre
                        ? bookRepository.findFeedGuestAndGenre(genre, exclusions, pageable)
                        : bookRepository.findFeedGuest(exclusions, pageable);
            }
        } else {
            // INTERCAMBIAR siempre ve todo (el modal en el feed actúa como gate).
            // El resto de intenciones solo ve libros de trueque si tiene un libro propio
            // disponible marcado como trueque.
            if (user.getOnboardingIntent() == OnboardingIntent.INTERCAMBIAR) {
                filterTrueque = false;
            } else {
                boolean hasAvailableTruequeBook = bookRepository.existsByOwner_IdAndStatusAndTrueque(
                        user.getId(), BookStatus.AVAILABLE, true);
                filterTrueque = !hasAvailableTruequeBook;
            }
            if (effectiveLat != null && effectiveLng != null) {
                result = filterTrueque
                        ? (hasGenre
                            ? bookRepository.findFeedByProximityAndGenreNoTrueque(
                                    user.getId(), effectiveLat, effectiveLng, genre, exclusions, pageable)
                            : bookRepository.findFeedByProximityNoTrueque(
                                    user.getId(), effectiveLat, effectiveLng, exclusions, pageable))
                        : (hasGenre
                            ? bookRepository.findFeedByProximityAndGenre(
                                    user.getId(), effectiveLat, effectiveLng, genre, exclusions, pageable)
                            : bookRepository.findFeedByProximity(
                                    user.getId(), effectiveLat, effectiveLng, exclusions, pageable));
            } else {
                result = filterTrueque
                        ? (hasGenre
                            ? bookRepository.findFeedBasicAndGenreNoTrueque(user.getId(), genre, exclusions, pageable)
                            : bookRepository.findFeedBasicNoTrueque(user.getId(), exclusions, pageable))
                        : (hasGenre
                            ? bookRepository.findFeedBasicAndGenre(user.getId(), genre, exclusions, pageable)
                            : bookRepository.findFeedBasic(user.getId(), exclusions, pageable));
            }
        }

        final Double searchLat = effectiveLat;
        final Double searchLng = effectiveLng;

        List<BookResponse> books = result.getContent().stream()
                .map(b -> {
                    Double dist = null;
                    if (searchLat != null && searchLng != null
                            && b.getOwner().getLatitude() != null
                            && b.getOwner().getLongitude() != null) {
                        dist = haversineKm(searchLat, searchLng,
                                b.getOwner().getLatitude(), b.getOwner().getLongitude());
                    }
                    return bookService.toResponse(b, dist);
                })
                .toList();

        long truequeOnlyCount = (user != null && filterTrueque)
                ? bookRepository.countFeedTruequeOnly(user.getId())
                : 0;

        return new FeedPage(books, result.hasNext(), truequeOnlyCount);
    }

    private static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public record FeedPage(List<BookResponse> books, boolean hasMore, long truequeOnlyCount) {}
}
