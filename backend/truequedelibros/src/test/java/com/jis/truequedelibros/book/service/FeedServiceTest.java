package com.jis.truequedelibros.book.service;

import com.jis.truequedelibros.book.domain.Book;
import com.jis.truequedelibros.book.domain.BookStatus;
import com.jis.truequedelibros.book.dto.BookResponse;
import com.jis.truequedelibros.book.repository.BookRepository;
import com.jis.truequedelibros.like.repository.BookDislikeRepository;
import com.jis.truequedelibros.like.repository.BookLikeRepository;
import com.jis.truequedelibros.user.domain.OnboardingIntent;
import com.jis.truequedelibros.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeedServiceTest {

    @Mock
    private BookRepository bookRepository;
    @Mock
    private BookService bookService;
    @Mock
    private BookLikeRepository bookLikeRepository;
    @Mock
    private BookDislikeRepository bookDislikeRepository;

    private FeedService feedService;
    private User user;

    @BeforeEach
    void setUp() {
        feedService = new FeedService(bookRepository, bookService, bookLikeRepository, bookDislikeRepository, new FeedBatchStore());
        user = User.builder().id(UUID.randomUUID()).onboardingIntent(OnboardingIntent.INTERCAMBIAR).build();

        lenient().when(bookService.toResponse(any(Book.class), any()))
                .thenAnswer(inv -> BookResponse.builder().id(((Book) inv.getArgument(0)).getId()).build());
        lenient().when(bookLikeRepository.findLikedBookIds(any(), anyList())).thenReturn(List.of());
        lenient().when(bookDislikeRepository.findDislikedBookIds(any(), anyList())).thenReturn(List.of());
        lenient().when(bookRepository.findAllById(anyList())).thenAnswer(inv -> {
            List<UUID> ids = inv.getArgument(0);
            Map<UUID, Book> byId = allBooks.stream().collect(Collectors.toMap(Book::getId, b -> b));
            return ids.stream().map(byId::get).filter(Objects::nonNull).toList();
        });
    }

    private List<Book> allBooks = new ArrayList<>();

    private List<Book> books(int count) {
        allBooks = IntStream.range(0, count)
                .mapToObj(i -> Book.builder().id(UUID.randomUUID()).status(BookStatus.AVAILABLE).build())
                .toList();
        return allBooks;
    }

    @Test
    void createsBatchAndReturnsFirstPageInOrder() {
        List<Book> books = books(25);
        when(bookRepository.findFeedBasic(eq(user.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(books, PageRequest.of(0, 150), books.size()));

        FeedService.FeedPage page = feedService.getFeed(user, null, null, null, null);

        assertThat(page.books()).hasSize(20);
        assertThat(page.books().stream().map(BookResponse::getId).toList())
                .containsExactlyElementsOf(books.subList(0, 20).stream().map(Book::getId).toList());
        assertThat(page.hasMore()).isTrue();
        assertThat(page.cursor()).isNotNull();
    }

    @Test
    void pagingWithCursorAdvancesWithoutRepeatsOrSkipsAndDoesNotRequeryRanking() {
        List<Book> books = books(45);
        when(bookRepository.findFeedBasic(eq(user.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(books, PageRequest.of(0, 150), books.size()));

        FeedService.FeedPage page1 = feedService.getFeed(user, null, null, null, null);
        FeedService.FeedPage page2 = feedService.getFeed(user, page1.cursor(), null, null, null);
        FeedService.FeedPage page3 = feedService.getFeed(user, page2.cursor(), null, null, null);

        assertThat(page1.books()).hasSize(20);
        assertThat(page2.books()).hasSize(20);
        assertThat(page3.books()).hasSize(5);
        assertThat(page3.hasMore()).isFalse();

        List<UUID> servedIds = new ArrayList<>();
        servedIds.addAll(page1.books().stream().map(BookResponse::getId).toList());
        servedIds.addAll(page2.books().stream().map(BookResponse::getId).toList());
        servedIds.addAll(page3.books().stream().map(BookResponse::getId).toList());
        assertThat(servedIds).containsExactlyElementsOf(books.stream().map(Book::getId).toList());

        verify(bookRepository, times(1)).findFeedBasic(eq(user.getId()), any(Pageable.class));
    }

    @Test
    void exhaustedBatchReturnsHasMoreFalseOnFirstPageWhenFewerBooksThanPageSize() {
        List<Book> books = books(10);
        when(bookRepository.findFeedBasic(eq(user.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(books, PageRequest.of(0, 150), books.size()));

        FeedService.FeedPage page = feedService.getFeed(user, null, null, null, null);

        assertThat(page.books()).hasSize(10);
        assertThat(page.hasMore()).isFalse();
    }

    @Test
    void staleBookIsFilteredOutWithoutShorteningThePage() {
        List<Book> books = books(21);
        when(bookRepository.findFeedBasic(eq(user.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(books, PageRequest.of(0, 150), books.size()));
        UUID likedMidBatch = books.get(5).getId();
        when(bookLikeRepository.findLikedBookIds(eq(user.getId()), anyList())).thenReturn(List.of(likedMidBatch));

        FeedService.FeedPage page = feedService.getFeed(user, null, null, null, null);

        List<UUID> returnedIds = page.books().stream().map(BookResponse::getId).toList();
        assertThat(returnedIds).hasSize(20);
        assertThat(returnedIds).doesNotContain(likedMidBatch);
        assertThat(returnedIds).contains(books.get(20).getId());
    }

    @Test
    void exhaustedCursorFallsBackToFreshBatchInsteadOfReturningEmptyForever() {
        List<Book> firstBatchBooks = IntStream.range(0, 5)
                .mapToObj(i -> Book.builder().id(UUID.randomUUID()).status(BookStatus.AVAILABLE).build())
                .toList();
        List<Book> secondBatchBooks = IntStream.range(0, 3)
                .mapToObj(i -> Book.builder().id(UUID.randomUUID()).status(BookStatus.AVAILABLE).build())
                .toList();
        allBooks = new ArrayList<>();
        allBooks.addAll(firstBatchBooks);
        allBooks.addAll(secondBatchBooks);

        when(bookRepository.findFeedBasic(eq(user.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(firstBatchBooks, PageRequest.of(0, 150), firstBatchBooks.size()))
                .thenReturn(new PageImpl<>(secondBatchBooks, PageRequest.of(0, 150), secondBatchBooks.size()));

        FeedService.FeedPage page1 = feedService.getFeed(user, null, null, null, null);
        assertThat(page1.hasMore()).isFalse();
        assertThat(page1.books()).hasSize(5);

        // Simulates FeedPage.jsx's force-reload-on-empty-queue effect, which retries with the
        // same (now exhausted) cursor once the local queue empties.
        FeedService.FeedPage page2 = feedService.getFeed(user, page1.cursor(), null, null, null);

        assertThat(page2.books()).hasSize(3);
        assertThat(page2.books().stream().map(BookResponse::getId).toList())
                .containsExactlyElementsOf(secondBatchBooks.stream().map(Book::getId).toList());
        assertThat(page2.cursor()).isNotEqualTo(page1.cursor());
        verify(bookRepository, times(2)).findFeedBasic(eq(user.getId()), any(Pageable.class));
    }

    @Test
    void truequeOnlyCountIsComputedWhenTruequeFilterApplies() {
        User sellerUser = User.builder().id(UUID.randomUUID()).onboardingIntent(OnboardingIntent.VENDER).build();
        when(bookRepository.existsByOwner_IdAndStatusAndTrueque(sellerUser.getId(), BookStatus.AVAILABLE, true))
                .thenReturn(false);
        List<Book> books = books(5);
        when(bookRepository.findFeedBasicNoTrueque(eq(sellerUser.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(books, PageRequest.of(0, 150), books.size()));
        when(bookRepository.countFeedTruequeOnly(sellerUser.getId())).thenReturn(7L);

        FeedService.FeedPage page = feedService.getFeed(sellerUser, null, null, null, null);

        assertThat(page.truequeOnlyCount()).isEqualTo(7L);
    }
}
