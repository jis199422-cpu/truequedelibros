package com.jis.truequedelibros.like.service;

import com.jis.truequedelibros.beneficio.domain.Local;
import com.jis.truequedelibros.beneficio.domain.Promocion;
import com.jis.truequedelibros.book.domain.Book;
import com.jis.truequedelibros.book.domain.BookStatus;
import com.jis.truequedelibros.book.repository.BookRepository;
import com.jis.truequedelibros.conversation.domain.Conversation;
import com.jis.truequedelibros.conversation.service.ConversationService;
import com.jis.truequedelibros.like.domain.BookDislike;
import com.jis.truequedelibros.like.domain.BookLike;
import com.jis.truequedelibros.like.dto.DailyLikeStatusResponse;
import com.jis.truequedelibros.like.dto.ReceivedLikeResponse;
import com.jis.truequedelibros.like.repository.BookDislikeRepository;
import com.jis.truequedelibros.like.repository.BookLikeRepository;
import com.jis.truequedelibros.match.domain.Match;
import com.jis.truequedelibros.match.repository.MatchRepository;
import com.jis.truequedelibros.auth.service.EmailService;
import com.jis.truequedelibros.notification.service.NotificationService;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final BookRepository bookRepository;
    private final BookLikeRepository bookLikeRepository;
    private final BookDislikeRepository bookDislikeRepository;
    private final MatchRepository matchRepository;
    private final ConversationService conversationService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    private static final ZoneId ARGENTINA = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final int WINDOW_HOURS = 12;

    private LocalDateTime windowStart() {
        return LocalDateTime.now(ZoneId.systemDefault()).minusHours(WINDOW_HOURS);
    }

    private long computeDailyLimit() {
        long total = bookRepository.count();
        return Math.max(1, Math.round(total * 0.30));
    }

    @Transactional(readOnly = true)
    public DailyLikeStatusResponse getDailyLikeStatus(User user) {
        long limit = computeDailyLimit();
        LocalDateTime start = windowStart();
        LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());
        long count = bookLikeRepository.countDailyLikes(user.getId(), start, now);

        String resetAt = bookLikeRepository.findOldestCreatedAtSince(user.getId(), start)
                .map(oldest -> oldest.plusHours(WINDOW_HOURS)
                        .atZone(ZoneId.systemDefault())
                        .withZoneSameInstant(ARGENTINA)
                        .toInstant()
                        .toString())
                .orElse(null);

        boolean hasBooks = bookRepository.existsByOwner_IdAndStatus(user.getId(), BookStatus.AVAILABLE);
        return new DailyLikeStatusResponse(count, limit, user.isPremium(), resetAt, hasBooks);
    }

    @Transactional
    public LikeResult like(User liker, UUID bookId) {
        if (liker.getTermsAcceptedAt() == null) {
            throw new AppException("Debés aceptar los términos y condiciones de la plataforma", HttpStatus.FORBIDDEN);
        }

        if (!liker.isPremium() && !bookRepository.existsByOwner_IdAndStatus(liker.getId(), BookStatus.AVAILABLE)) {
            long limit = computeDailyLimit();
            LocalDateTime start = windowStart();
            LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());
            long windowCount = bookLikeRepository.countDailyLikes(liker.getId(), start, now);
            if (windowCount >= limit) {
                throw new AppException("Límite diario de likes alcanzado", HttpStatus.TOO_MANY_REQUESTS);
            }
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new AppException("Libro no encontrado", HttpStatus.NOT_FOUND));

        if (book.getOwner().getId().equals(liker.getId())) {
            throw new AppException("No puedes dar like a tus propios libros", HttpStatus.BAD_REQUEST);
        }
        boolean esPuntoSeguro = book.getLocal() != null;
        boolean pureTrueque = !esPuntoSeguro && book.isTrueque() && !book.isVenta() && !book.isRegalo();
        if (pureTrueque && !bookRepository.existsByOwner_IdAndStatusAndTrueque(
                liker.getId(), BookStatus.AVAILABLE, true)) {
            throw new AppException(
                    "Necesitás tener al menos un libro disponible para trueque para dar like a este libro",
                    HttpStatus.BAD_REQUEST);
        }
        if (bookLikeRepository.existsByLiker_IdAndBook_Id(liker.getId(), bookId)) {
            throw new AppException("Ya diste like a este libro", HttpStatus.CONFLICT);
        }

        // Remove any existing dislike
        bookDislikeRepository.deleteByDisliker_IdAndBook_Id(liker.getId(), bookId);

        bookLikeRepository.save(BookLike.builder().liker(liker).book(book).build());

        User owner = book.getOwner();

        if (esPuntoSeguro) {
            Local local = book.getLocal();
            int plazoDias = liker.isPremium() ? 60 : 30;
            List<String> promociones = local.getPromociones().stream()
                    .filter(Promocion::isActive)
                    .map(Promocion::getDescription)
                    .toList();
            PuntoSeguroInfo info = new PuntoSeguroInfo(
                    local.getId(), local.getName(), local.getAddress(),
                    plazoDias, liker.isPremium(), promociones);
            return new LikeResult(false, null, null, false, info);
        }

        if (book.isVenta() || book.isRegalo()) {
            Conversation conversation = conversationService.openBookContact(liker, book);
            return new LikeResult(false, null, conversation.getId(), true, null);
        }

        Optional<BookLike> mutualLike =
                bookLikeRepository.findFirstByLiker_IdAndBook_Owner_Id(owner.getId(), liker.getId());

        if (mutualLike.isPresent()) {
            Book likedByOwner = mutualLike.get().getBook();
            Match match = matchRepository.save(Match.builder()
                    .userA(liker).userB(owner).bookA(likedByOwner).bookB(book).build());

            Conversation conversation = conversationService.findOrCreate(liker, owner);
            notificationService.notifyMatch(liker, owner, match.getId());

            return new LikeResult(true, match.getId(), conversation.getId(), false, null);
        }

        notificationService.notifyBookLiked(owner, liker, book.getTitle(), bookId);
        if (owner.isNotifyOnBookLike()) {
            emailService.sendBookLikedEmail(owner.getEmail(), owner.getName(), liker.getName(), book.getTitle());
        }
        return new LikeResult(false, null, null, false, null);
    }

    @Transactional
    public void dislike(User disliker, UUID bookId) {
        if (!bookRepository.existsById(bookId)) {
            throw new AppException("Libro no encontrado", HttpStatus.NOT_FOUND);
        }
        bookLikeRepository.deleteByLiker_IdAndBook_Id(disliker.getId(), bookId);
        if (!bookDislikeRepository.existsByDisliker_IdAndBook_Id(disliker.getId(), bookId)) {
            Book book = bookRepository.getReferenceById(bookId);
            bookDislikeRepository.save(BookDislike.builder().disliker(disliker).book(book).build());
        }
    }

    @Transactional(readOnly = true)
    public LikesPage getPendingLikesReceived(User user, int page) {
        PageRequest pageable = PageRequest.of(page, 10);
        Page<BookLike> result = bookLikeRepository.findPendingLikesReceivedBy(user, pageable);
        List<ReceivedLikeResponse> items = result.getContent().stream()
                .map(bl -> {
                    int bookCount = (int) bookRepository.countByOwner_IdAndTruequeTrue(bl.getLiker().getId());
                    return new ReceivedLikeResponse(
                            new ReceivedLikeResponse.LikerInfo(
                                    bl.getLiker().getId(),
                                    bl.getLiker().getName(),
                                    bl.getLiker().getProfilePictureUrl(),
                                    bl.getLiker().getCity(),
                                    bookCount),
                            new ReceivedLikeResponse.BookInfo(
                                    bl.getBook().getId(),
                                    bl.getBook().getTitle(),
                                    bl.getBook().getAuthor(),
                                    bl.getBook().getCoverImageUrl()),
                            bl.getCreatedAt());
                })
                .toList();
        return new LikesPage(items, result.hasNext(), result.getTotalElements());
    }

    public record LikeResult(boolean matched, UUID matchId, UUID conversationId, boolean directContact,
                              PuntoSeguroInfo puntoSeguro) {}
    public record PuntoSeguroInfo(UUID localId, String localName, String localAddress,
                                   int plazoDias, boolean isPremiumUser, List<String> promociones) {}
    public record LikesPage(List<ReceivedLikeResponse> items, boolean hasMore, long totalCount) {}
}
