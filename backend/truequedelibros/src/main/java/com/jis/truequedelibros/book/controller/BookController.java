package com.jis.truequedelibros.book.controller;

import com.jis.truequedelibros.book.dto.*;
import com.jis.truequedelibros.book.service.BookService;
import com.jis.truequedelibros.book.service.FeedService;
import com.jis.truequedelibros.book.service.OpenAiService;
import com.jis.truequedelibros.storage.S3StorageService;
import com.jis.truequedelibros.user.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;
    private final FeedService feedService;
    private final S3StorageService s3StorageService;
    private final OpenAiService openAiService;

    @PostMapping("/enrich")
    public ResponseEntity<BookEnrichResponse> enrich(@RequestBody BookEnrichRequest request) {
        if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            return ResponseEntity.ok(openAiService.enrichFromImage(request.getImageUrl()));
        }
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            return ResponseEntity.ok(openAiService.enrichFromTitle(request.getTitle()));
        }
        return ResponseEntity.ok(BookEnrichResponse.builder().build());
    }

    @PostMapping("/upload-url")
    public ResponseEntity<UploadUrlResponse> getUploadUrl(
            @Valid @RequestBody UploadUrlRequest request) {
        return ResponseEntity.ok(s3StorageService.generateUploadUrl(
                "books", request.getFileName(), request.getContentType()));
    }

    @PostMapping
    public ResponseEntity<BookResponse> create(
            @Valid @RequestBody CreateBookRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookService.create(request, user));
    }

    @GetMapping("/feed")
    public ResponseEntity<FeedService.FeedPage> getFeed(
            @RequestParam(required = false) UUID cursor,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(feedService.getFeed(user, cursor, genre, lat, lng));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(bookService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBookRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookService.update(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        bookService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
