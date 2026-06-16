package com.jis.truequedelibros.conversation.controller;

import com.jis.truequedelibros.book.domain.Book;
import com.jis.truequedelibros.book.repository.BookRepository;
import com.jis.truequedelibros.conversation.domain.Conversation;
import com.jis.truequedelibros.conversation.dto.BookContactRequest;
import com.jis.truequedelibros.conversation.dto.ConversationResponse;
import com.jis.truequedelibros.conversation.dto.MessageResponse;
import com.jis.truequedelibros.conversation.dto.OfferConversationRequest;
import com.jis.truequedelibros.conversation.service.ConversationService;
import com.jis.truequedelibros.conversation.service.MessageService;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final MessageService messageService;
    private final BookRepository bookRepository;

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getConversations(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(conversationService.getConversations(user));
    }

    @PostMapping("/offer")
    public ResponseEntity<Map<String, UUID>> startOffer(
            @Valid @RequestBody OfferConversationRequest request,
            @AuthenticationPrincipal User user) {
        if (!user.isPremium()) {
            throw new AppException("Esta función es exclusiva para usuarios premium", HttpStatus.FORBIDDEN);
        }
        Conversation conv = conversationService.findOrCreateByUserId(request.getTargetUserId(), user);
        return ResponseEntity.ok(Map.of("conversationId", conv.getId()));
    }

    @PostMapping("/book-contact")
    public ResponseEntity<Map<String, UUID>> startBookContact(
            @Valid @RequestBody BookContactRequest request,
            @AuthenticationPrincipal User user) {
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new AppException("Libro no encontrado", HttpStatus.NOT_FOUND));
        if (!book.isVenta() && !book.isRegalo()) {
            throw new AppException("Este libro no está disponible para contacto directo", HttpStatus.BAD_REQUEST);
        }
        Conversation conv = conversationService.findOrCreate(user, book.getOwner());
        return ResponseEntity.ok(Map.of("conversationId", conv.getId()));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(messageService.getMessages(id, user, page));
    }
}
