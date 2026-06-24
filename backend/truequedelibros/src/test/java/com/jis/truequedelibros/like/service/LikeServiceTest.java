package com.jis.truequedelibros.like.service;

import com.jis.truequedelibros.auth.service.EmailService;
import com.jis.truequedelibros.beneficio.domain.Local;
import com.jis.truequedelibros.beneficio.domain.Promocion;
import com.jis.truequedelibros.book.domain.Book;
import com.jis.truequedelibros.book.domain.BookStatus;
import com.jis.truequedelibros.book.repository.BookRepository;
import com.jis.truequedelibros.conversation.service.ConversationService;
import com.jis.truequedelibros.like.repository.BookDislikeRepository;
import com.jis.truequedelibros.like.repository.BookLikeRepository;
import com.jis.truequedelibros.match.repository.MatchRepository;
import com.jis.truequedelibros.notification.service.NotificationService;
import com.jis.truequedelibros.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LikeServiceTest {

    @Mock private BookRepository bookRepository;
    @Mock private BookLikeRepository bookLikeRepository;
    @Mock private BookDislikeRepository bookDislikeRepository;
    @Mock private MatchRepository matchRepository;
    @Mock private ConversationService conversationService;
    @Mock private NotificationService notificationService;
    @Mock private EmailService emailService;

    private LikeService likeService;

    @BeforeEach
    void setUp() {
        likeService = new LikeService(bookRepository, bookLikeRepository, bookDislikeRepository,
                matchRepository, conversationService, notificationService, emailService);
    }

    private User liker(boolean premium) {
        return User.builder()
                .id(UUID.randomUUID())
                .premium(premium)
                .termsAcceptedAt(LocalDateTime.now())
                .build();
    }

    private Book puntoSeguroBook(Local local) {
        return Book.builder()
                .id(UUID.randomUUID())
                .owner(local.getOwner())
                .local(local)
                .trueque(true)
                .venta(false)
                .regalo(false)
                .status(BookStatus.AVAILABLE)
                .build();
    }

    private Local localWithPromos(User owner, String... promoDescriptions) {
        Local local = Local.builder()
                .id(UUID.randomUUID())
                .name("Librería Central")
                .address("Av. San Martín 123")
                .owner(owner)
                .build();
        List<Promocion> promos = List.of(promoDescriptions).stream()
                .map(d -> Promocion.builder().description(d).active(true).local(local).build())
                .toList();
        local.setPromociones(promos);
        return local;
    }

    @Test
    void likeOnPuntoSeguroBook_doesNotRequireOwnTruequeBook() {
        User owner = User.builder().id(UUID.randomUUID()).build();
        Local local = localWithPromos(owner);
        Book book = puntoSeguroBook(local);
        User liker = liker(false);

        when(bookRepository.findById(book.getId())).thenReturn(java.util.Optional.of(book));
        when(bookRepository.existsByOwner_IdAndStatus(liker.getId(), BookStatus.AVAILABLE)).thenReturn(true);
        when(bookLikeRepository.existsByLiker_IdAndBook_Id(liker.getId(), book.getId())).thenReturn(false);

        LikeService.LikeResult result = likeService.like(liker, book.getId());

        assertThat(result.matched()).isFalse();
        assertThat(result.puntoSeguro()).isNotNull();
        verify(bookRepository, never()).existsByOwner_IdAndStatusAndTrueque(any(), any(), anyBoolean());
    }

    @Test
    void likeOnPuntoSeguroBook_nonPremiumUser_getsThirtyDayPlazo() {
        User owner = User.builder().id(UUID.randomUUID()).build();
        Local local = localWithPromos(owner, "20% de descuento en café");
        Book book = puntoSeguroBook(local);
        User liker = liker(false);

        when(bookRepository.findById(book.getId())).thenReturn(java.util.Optional.of(book));
        when(bookRepository.existsByOwner_IdAndStatus(liker.getId(), BookStatus.AVAILABLE)).thenReturn(true);
        when(bookLikeRepository.existsByLiker_IdAndBook_Id(liker.getId(), book.getId())).thenReturn(false);

        LikeService.LikeResult result = likeService.like(liker, book.getId());

        assertThat(result.puntoSeguro().plazoDias()).isEqualTo(30);
        assertThat(result.puntoSeguro().isPremiumUser()).isFalse();
        assertThat(result.puntoSeguro().localName()).isEqualTo("Librería Central");
        assertThat(result.puntoSeguro().promociones()).containsExactly("20% de descuento en café");
    }

    @Test
    void likeOnPuntoSeguroBook_premiumUser_getsSixtyDayPlazo() {
        User owner = User.builder().id(UUID.randomUUID()).build();
        Local local = localWithPromos(owner);
        Book book = puntoSeguroBook(local);
        User liker = liker(true);

        when(bookRepository.findById(book.getId())).thenReturn(java.util.Optional.of(book));
        when(bookLikeRepository.existsByLiker_IdAndBook_Id(liker.getId(), book.getId())).thenReturn(false);

        LikeService.LikeResult result = likeService.like(liker, book.getId());

        assertThat(result.puntoSeguro().plazoDias()).isEqualTo(60);
        assertThat(result.puntoSeguro().isPremiumUser()).isTrue();
    }

    @Test
    void likeOnPuntoSeguroBook_doesNotCreateMatchOrConversation() {
        User owner = User.builder().id(UUID.randomUUID()).build();
        Local local = localWithPromos(owner);
        Book book = puntoSeguroBook(local);
        User liker = liker(true);

        when(bookRepository.findById(book.getId())).thenReturn(java.util.Optional.of(book));
        when(bookLikeRepository.existsByLiker_IdAndBook_Id(liker.getId(), book.getId())).thenReturn(false);

        likeService.like(liker, book.getId());

        verify(matchRepository, never()).save(any());
        verify(conversationService, never()).findOrCreate(any(), any());
        verify(conversationService, never()).openBookContact(any(), any());
    }
}
