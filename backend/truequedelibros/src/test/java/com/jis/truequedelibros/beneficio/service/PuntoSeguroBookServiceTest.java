package com.jis.truequedelibros.beneficio.service;

import com.jis.truequedelibros.beneficio.domain.Local;
import com.jis.truequedelibros.beneficio.dto.PuntoSeguroBookRequest;
import com.jis.truequedelibros.beneficio.dto.PuntoSeguroBookResponse;
import com.jis.truequedelibros.beneficio.dto.PuntoSeguroBookUpdateRequest;
import com.jis.truequedelibros.beneficio.repository.LocalRepository;
import com.jis.truequedelibros.book.domain.Book;
import com.jis.truequedelibros.book.domain.BookCondition;
import com.jis.truequedelibros.book.domain.BookStatus;
import com.jis.truequedelibros.book.repository.BookRepository;
import com.jis.truequedelibros.auth.service.EmailService;
import com.jis.truequedelibros.book.service.OpenAiService;
import com.jis.truequedelibros.like.repository.BookDislikeRepository;
import com.jis.truequedelibros.like.repository.BookLikeRepository;
import com.jis.truequedelibros.match.repository.MatchRepository;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PuntoSeguroBookServiceTest {

    @Mock private BookRepository bookRepository;
    @Mock private LocalRepository localRepository;
    @Mock private BookLikeRepository bookLikeRepository;
    @Mock private BookDislikeRepository bookDislikeRepository;
    @Mock private MatchRepository matchRepository;
    @Mock private OpenAiService openAiService;
    @Mock private EmailService emailService;

    private PuntoSeguroBookService service;

    @BeforeEach
    void setUp() {
        service = new PuntoSeguroBookService(bookRepository, localRepository, bookLikeRepository,
                bookDislikeRepository, matchRepository, openAiService, emailService);
        org.springframework.test.util.ReflectionTestUtils.setField(
                service, "defaultCoverImageUrl", "https://example.com/default.png");
    }

    private Local local() {
        User owner = User.builder().id(UUID.randomUUID()).build();
        return Local.builder().id(UUID.randomUUID()).name("Librería Central").owner(owner).build();
    }

    @Test
    void adminCreateBook_forcesVentaFalseAndPrecioNull() {
        Local local = local();
        when(localRepository.findById(local.getId())).thenReturn(Optional.of(local));
        when(bookRepository.save(any(Book.class))).thenAnswer(inv -> {
            Book b = inv.getArgument(0);
            b.setId(UUID.randomUUID());
            return b;
        });

        PuntoSeguroBookRequest request = new PuntoSeguroBookRequest(
                "Cien años de soledad", "Gabriel García Márquez", "Novela",
                BookCondition.BUENO, "Edición usada", null);

        PuntoSeguroBookResponse response = service.adminCreateBook(local.getId(), request);

        ArgumentCaptor<Book> captor = ArgumentCaptor.forClass(Book.class);
        org.mockito.Mockito.verify(bookRepository).save(captor.capture());
        assertThat(captor.getValue().isVenta()).isFalse();
        assertThat(captor.getValue().getPrecio()).isNull();
        assertThat(captor.getValue().getOwner()).isEqualTo(local.getOwner());
        assertThat(captor.getValue().getLocal()).isEqualTo(local);
        assertThat(response.localId()).isEqualTo(local.getId());
    }

    @Test
    void adminUpdateBook_rejectsVentaTrue() {
        Local local = local();
        Book book = Book.builder().id(UUID.randomUUID()).local(local).owner(local.getOwner()).build();
        when(bookRepository.findById(book.getId())).thenReturn(Optional.of(book));

        PuntoSeguroBookUpdateRequest request = new PuntoSeguroBookUpdateRequest(
                null, null, null, null, null, null, null, true);

        assertThatThrownBy(() -> service.adminUpdateBook(local.getId(), book.getId(), request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("no se pueden vender");
    }

    @Test
    void adminUpdateBook_throwsWhenBookBelongsToDifferentLocal() {
        Local local = local();
        Local otherLocal = local();
        Book book = Book.builder().id(UUID.randomUUID()).local(otherLocal).owner(otherLocal.getOwner()).build();
        when(bookRepository.findById(book.getId())).thenReturn(Optional.of(book));

        PuntoSeguroBookUpdateRequest request = new PuntoSeguroBookUpdateRequest(
                "Nuevo título", null, null, null, null, null, null, null);

        assertThatThrownBy(() -> service.adminUpdateBook(local.getId(), book.getId(), request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("no pertenece a este local");
    }

    @Test
    void adminUpdateBook_allowsChangingStatus() {
        Local local = local();
        Book book = Book.builder().id(UUID.randomUUID()).local(local).owner(local.getOwner())
                .status(BookStatus.AVAILABLE).build();
        when(bookRepository.findById(book.getId())).thenReturn(Optional.of(book));
        when(bookRepository.save(any(Book.class))).thenAnswer(inv -> inv.getArgument(0));

        PuntoSeguroBookUpdateRequest request = new PuntoSeguroBookUpdateRequest(
                null, null, null, null, null, null, BookStatus.UNAVAILABLE, null);

        PuntoSeguroBookResponse response = service.adminUpdateBook(local.getId(), book.getId(), request);

        assertThat(response.status()).isEqualTo(BookStatus.UNAVAILABLE);
    }
}
