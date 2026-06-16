package com.jis.truequedelibros.book.service;

import com.jis.truequedelibros.book.domain.BookStatus;
import com.jis.truequedelibros.book.dto.BookResponse;
import com.jis.truequedelibros.book.repository.BookRepository;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final BookRepository bookRepository;
    private final BookService bookService;

    @Transactional(readOnly = true)
    public FeedPage getFeed(User user, int page, String genre, Double overrideLat, Double overrideLng) {
        PageRequest pageable = PageRequest.of(page, DEFAULT_PAGE_SIZE);
        boolean hasGenre = genre != null && !genre.isBlank();

        Double effectiveLat = overrideLat != null ? overrideLat
                : (user != null ? user.getLatitude() : null);
        Double effectiveLng = overrideLng != null ? overrideLng
                : (user != null ? user.getLongitude() : null);

        Page<com.jis.truequedelibros.book.domain.Book> result;

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
        } else {
            boolean noBooks = !bookRepository.existsByOwner_IdAndStatus(user.getId(), BookStatus.AVAILABLE);
            if (effectiveLat != null && effectiveLng != null) {
                result = noBooks
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
                result = noBooks
                        ? (hasGenre
                            ? bookRepository.findFeedBasicAndGenreNoTrueque(user.getId(), genre, pageable)
                            : bookRepository.findFeedBasicNoTrueque(user.getId(), pageable))
                        : (hasGenre
                            ? bookRepository.findFeedBasicAndGenre(user.getId(), genre, pageable)
                            : bookRepository.findFeedBasic(user.getId(), pageable));
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

        return new FeedPage(books, result.hasNext(), page + 1);
    }

    private static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public record FeedPage(List<BookResponse> books, boolean hasMore, int nextPage) {}
}
