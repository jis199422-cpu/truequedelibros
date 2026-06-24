package com.jis.truequedelibros.beneficio.service;

import com.jis.truequedelibros.auth.service.EmailService;
import com.jis.truequedelibros.beneficio.domain.Local;
import com.jis.truequedelibros.beneficio.dto.PuntoSeguroBookRequest;
import com.jis.truequedelibros.beneficio.dto.PuntoSeguroBookResponse;
import com.jis.truequedelibros.beneficio.dto.PuntoSeguroBookUpdateRequest;
import com.jis.truequedelibros.beneficio.repository.LocalRepository;
import com.jis.truequedelibros.book.domain.Book;
import com.jis.truequedelibros.book.repository.BookRepository;
import com.jis.truequedelibros.book.service.OpenAiService;
import com.jis.truequedelibros.like.repository.BookDislikeRepository;
import com.jis.truequedelibros.like.repository.BookLikeRepository;
import com.jis.truequedelibros.match.repository.MatchRepository;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PuntoSeguroBookService {

    private final BookRepository bookRepository;
    private final LocalRepository localRepository;
    private final BookLikeRepository bookLikeRepository;
    private final BookDislikeRepository bookDislikeRepository;
    private final MatchRepository matchRepository;
    private final OpenAiService openAiService;
    private final EmailService emailService;

    @Value("${book.default-cover-image-url}")
    private String defaultCoverImageUrl;

    @Transactional
    public PuntoSeguroBookResponse adminCreateBook(UUID localId, PuntoSeguroBookRequest request) {
        Local local = findLocalOrThrow(localId);

        Book book = bookRepository.save(Book.builder()
                .owner(local.getOwner())
                .local(local)
                .title(request.title())
                .author(request.author())
                .genre(request.genre())
                .condition(request.condition())
                .description(request.description())
                .coverImageUrl(
                        (request.coverImageUrl() != null && !request.coverImageUrl().isBlank())
                                ? request.coverImageUrl()
                                : defaultCoverImageUrl
                )
                .venta(false)
                .precio(null)
                .build());

        if (book.getDescription() == null || book.getDescription().isBlank()) {
            try {
                String description = openAiService.generateDescription(book.getTitle(), book.getAuthor());
                book.setDescription(description);
                bookRepository.save(book);
            } catch (Exception ignored) {}
        }

        return toResponse(book);
    }

    @Transactional
    public PuntoSeguroBookResponse adminUpdateBook(UUID localId, UUID bookId, PuntoSeguroBookUpdateRequest request) {
        Book book = findBookOfLocal(localId, bookId);

        if (Boolean.TRUE.equals(request.venta())) {
            throw new AppException("Los libros de punto seguro no se pueden vender", HttpStatus.BAD_REQUEST);
        }

        if (request.title() != null) book.setTitle(request.title());
        if (request.author() != null) book.setAuthor(request.author());
        if (request.genre() != null) book.setGenre(request.genre());
        if (request.condition() != null) book.setCondition(request.condition());
        if (request.description() != null) book.setDescription(request.description());
        if (request.coverImageUrl() != null) book.setCoverImageUrl(request.coverImageUrl());
        if (request.status() != null) book.setStatus(request.status());

        return toResponse(bookRepository.save(book));
    }

    @Transactional(readOnly = true)
    public List<PuntoSeguroBookResponse> getBooksByLocal(UUID localId) {
        findLocalOrThrow(localId);
        return bookRepository.findByLocal_IdOrderByCreatedAtDesc(localId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public void reportBookUnavailable(UUID localId, UUID bookId, User reporter, String message) {
        Local local = findLocalOrThrow(localId);
        Book book = findBookOfLocal(localId, bookId);
        emailService.sendBookUnavailableReport(
                book.getTitle(), local.getName(),
                reporter.getName(), reporter.getEmail(),
                LocalDateTime.now(), message
        );
    }

    @Transactional
    public void adminDeleteBook(UUID localId, UUID bookId) {
        Book book = findBookOfLocal(localId, bookId);

        if (matchRepository.existsByBookId(bookId)) {
            throw new AppException(
                    "No se puede eliminar este libro porque tiene un intercambio activo.",
                    HttpStatus.CONFLICT
            );
        }

        bookLikeRepository.deleteByBook_Id(bookId);
        bookDislikeRepository.deleteByBook_Id(bookId);
        bookRepository.delete(book);
    }

    private Local findLocalOrThrow(UUID localId) {
        return localRepository.findById(localId)
                .orElseThrow(() -> new AppException("Local no encontrado", HttpStatus.NOT_FOUND));
    }

    private Book findBookOfLocal(UUID localId, UUID bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new AppException("Libro no encontrado", HttpStatus.NOT_FOUND));

        if (book.getLocal() == null || !book.getLocal().getId().equals(localId)) {
            throw new AppException("El libro no pertenece a este local", HttpStatus.CONFLICT);
        }

        return book;
    }

    private PuntoSeguroBookResponse toResponse(Book book) {
        return new PuntoSeguroBookResponse(
                book.getId(),
                book.getTitle(),
                book.getAuthor(),
                book.getGenre(),
                book.getCondition(),
                book.getDescription(),
                book.getCoverImageUrl(),
                book.getStatus(),
                book.getLocal() != null ? book.getLocal().getId() : null,
                book.getCreatedAt(),
                book.getUpdatedAt()
        );
    }
}
