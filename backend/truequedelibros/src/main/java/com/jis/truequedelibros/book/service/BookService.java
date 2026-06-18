package com.jis.truequedelibros.book.service;

import com.jis.truequedelibros.analytics.service.ProductEventService;
import com.jis.truequedelibros.book.domain.Book;
import com.jis.truequedelibros.book.dto.BookResponse;
import com.jis.truequedelibros.book.dto.CreateBookRequest;
import com.jis.truequedelibros.book.dto.UpdateBookRequest;
import com.jis.truequedelibros.book.repository.BookRepository;
import com.jis.truequedelibros.like.repository.BookDislikeRepository;
import com.jis.truequedelibros.like.repository.BookLikeRepository;
import com.jis.truequedelibros.match.repository.MatchRepository;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.User;
import com.jis.truequedelibros.wishlist.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final BookLikeRepository bookLikeRepository;
    private final BookDislikeRepository bookDislikeRepository;
    private final MatchRepository matchRepository;
    private final WishlistService wishlistService;
    private final OpenAiService openAiService;
    private final ProductEventService productEventService;

    @Value("${book.default-cover-image-url}")
    private String defaultCoverImageUrl;

    @Transactional
    public BookResponse create(CreateBookRequest request, User owner) {
        if (owner.getLatitude() == null || owner.getLongitude() == null) {
            throw new AppException("Debés configurar tu ubicación antes de publicar un libro", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        Book book = bookRepository.save(Book.builder()
                .owner(owner)
                .title(request.getTitle())
                .author(request.getAuthor())
                .genre(request.getGenre())
                .condition(request.getCondition())
                .description(request.getDescription())
                .coverImageUrl(
                        (request.getCoverImageUrl() != null && !request.getCoverImageUrl().isBlank())
                                ? request.getCoverImageUrl()
                                : defaultCoverImageUrl
                )
                .regalo(Boolean.TRUE.equals(request.getRegalo()))
                .trueque(request.getTrueque() == null || Boolean.TRUE.equals(request.getTrueque()))
                .venta(Boolean.TRUE.equals(request.getVenta()))
                .precio(Boolean.TRUE.equals(request.getVenta()) ? request.getPrecio() : null)
                .build());

        if (book.getDescription() == null || book.getDescription().isBlank()) {
            try {
                String description = openAiService.generateDescription(book.getTitle(), book.getAuthor());
                book.setDescription(description);
                bookRepository.save(book);
            } catch (Exception ignored) {
                // Silent failure — book already persisted, description remains empty
            }
        }

        wishlistService.notifyInterestedUsers(book);

        long bookCount = bookRepository.countByOwner_Id(owner.getId());
        boolean isFirst = bookCount == 1 && !productEventService.hasRecordedFirstBook(owner.getId());
        if (isFirst) {
            productEventService.record(owner.getId(), ProductEventService.FIRST_BOOK_UPLOADED,
                    Map.of("intent", owner.getOnboardingIntent() != null ? owner.getOnboardingIntent().name() : "UNKNOWN"));
        }

        BookResponse response = toResponse(book);
        response.setFirstBook(isFirst);
        return response;
    }

    @Transactional
    public BookResponse update(UUID bookId, UpdateBookRequest request, User requester) {
        Book book = findBookOwnedBy(bookId, requester.getId());

        if (request.getTitle() != null) book.setTitle(request.getTitle());
        if (request.getAuthor() != null) book.setAuthor(request.getAuthor());
        if (request.getGenre() != null) book.setGenre(request.getGenre());
        if (request.getCondition() != null) book.setCondition(request.getCondition());
        if (request.getDescription() != null) book.setDescription(request.getDescription());
        if (request.getCoverImageUrl() != null) book.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getStatus() != null) book.setStatus(request.getStatus());
        if (request.getRegalo() != null) book.setRegalo(request.getRegalo());
        if (request.getTrueque() != null) book.setTrueque(request.getTrueque());
        if (request.getVenta() != null) {
            book.setVenta(request.getVenta());
            if (!request.getVenta()) book.setPrecio(null);
        }
        if (request.getPrecio() != null && book.isVenta()) book.setPrecio(request.getPrecio());

        return toResponse(bookRepository.save(book));
    }

    @Transactional
    public void delete(UUID bookId, User requester) {
        Book book = findBookOwnedBy(bookId, requester.getId());

        if (matchRepository.existsByBookId(bookId)) {
            throw new AppException(
                "No puedes eliminar este libro porque tiene un intercambio activo. Cancela el intercambio primero.",
                HttpStatus.CONFLICT
            );
        }

        bookLikeRepository.deleteByBook_Id(bookId);
        bookDislikeRepository.deleteByBook_Id(bookId);
        bookRepository.delete(book);
    }

    @Transactional(readOnly = true)
    public BookResponse getById(UUID bookId) {
        return toResponse(bookRepository.findById(bookId)
                .orElseThrow(() -> new AppException("Libro no encontrado", HttpStatus.NOT_FOUND)));
    }

    @Transactional(readOnly = true)
    public List<BookResponse> getByOwner(UUID ownerId, UUID requesterId) {
        List<Book> books = bookRepository.findByOwner_IdOrderByCreatedAtDesc(ownerId);

        Set<UUID> likedBookIds = (requesterId == null || books.isEmpty())
                ? Set.of()
                : new HashSet<>(bookLikeRepository.findLikedBookIds(
                        requesterId, books.stream().map(Book::getId).toList()));

        return books.stream()
                .map(book -> {
                    BookResponse response = toResponse(book);
                    response.setLikedByCurrentUser(likedBookIds.contains(book.getId()));
                    return response;
                })
                .toList();
    }

    public BookResponse toResponse(Book book, Double distanceKm) {
        BookResponse r = toResponse(book);
        r.setDistanceKm(distanceKm);
        return r;
    }

    public BookResponse toResponse(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .genre(book.getGenre())
                .condition(book.getCondition())
                .description(book.getDescription())
                .coverImageUrl(book.getCoverImageUrl())
                .status(book.getStatus())
                .regalo(book.isRegalo())
                .trueque(book.isTrueque())
                .venta(book.isVenta())
                .precio(book.getPrecio())
                .owner(BookResponse.OwnerInfo.builder()
                        .id(book.getOwner().getId())
                        .name(book.getOwner().getName())
                        .profilePictureUrl(book.getOwner().getProfilePictureUrl())
                        .city(book.getOwner().getCity())
                        .build())
                .createdAt(book.getCreatedAt())
                .build();
    }

    private Book findBookOwnedBy(UUID bookId, UUID ownerId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new AppException("Libro no encontrado", HttpStatus.NOT_FOUND));

        if (!book.getOwner().getId().equals(ownerId)) {
            throw new AppException("No tienes permiso para modificar este libro", HttpStatus.FORBIDDEN);
        }

        return book;
    }
}
