package com.jis.truequedelibros.admin.service;

import com.jis.truequedelibros.admin.dto.ActivationStatsResponse;
import com.jis.truequedelibros.admin.dto.AdminBookResponse;
import com.jis.truequedelibros.admin.dto.AdminStatsResponse;
import com.jis.truequedelibros.admin.dto.AdminUserResponse;
import com.jis.truequedelibros.analytics.repository.ProductEventRepository;
import com.jis.truequedelibros.analytics.service.ProductEventService;
import com.jis.truequedelibros.book.domain.Book;
import com.jis.truequedelibros.book.domain.BookStatus;
import com.jis.truequedelibros.book.repository.BookRepository;
import com.jis.truequedelibros.match.repository.MatchRepository;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.User;
import com.jis.truequedelibros.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final MatchRepository matchRepository;
    private final ProductEventRepository productEventRepository;

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long bannedUsers = userRepository.countByActiveFalse();
        long newUsersThisWeek = userRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(7));
        long totalBooks = bookRepository.count();
        long availableBooks = bookRepository.countByStatus(BookStatus.AVAILABLE);
        long totalMatches = matchRepository.count();

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(totalUsers - bannedUsers)
                .bannedUsers(bannedUsers)
                .newUsersThisWeek(newUsersThisWeek)
                .totalBooks(totalBooks)
                .availableBooks(availableBooks)
                .totalMatches(totalMatches)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers() {
        Map<UUID, Long> bookCounts = bookRepository.countBooksByOwner()
                .stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));

        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(u -> toUserResponse(u, bookCounts.getOrDefault(u.getId(), 0L)))
                .toList();
    }

    @Transactional
    public AdminUserResponse toggleBan(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("Usuario no encontrado", HttpStatus.NOT_FOUND));
        user.setActive(!user.isActive());
        userRepository.save(user);
        return toUserResponse(user, bookRepository.countBooksByOwner()
                .stream()
                .filter(row -> row[0].equals(userId))
                .mapToLong(row -> (Long) row[1])
                .findFirst().orElse(0L));
    }

    @Transactional(readOnly = true)
    public List<AdminBookResponse> getBooks() {
        return bookRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toBookResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ActivationStatsResponse getActivationStats() {
        long registeredUsers = userRepository.countByEmailVerifiedTrue();
        long onboardingCompleted = userRepository.countByOnboardingCompletedTrue();
        long intentIntercambiar = userRepository.countByOnboardingIntent("INTERCAMBIAR");
        long intentVender = userRepository.countByOnboardingIntent("VENDER");
        long intentComprar = userRepository.countByOnboardingIntent("COMPRAR");
        long firstBookUploaded = productEventRepository.countDistinctUsersByEventName(ProductEventService.FIRST_BOOK_UPLOADED);
        double conversionRate = registeredUsers > 0 ? (double) firstBookUploaded / registeredUsers * 100.0 : 0.0;
        Double avgMinutes = productEventRepository.avgMinutesFromRegistration(ProductEventService.FIRST_BOOK_UPLOADED);

        return ActivationStatsResponse.builder()
                .registeredUsers(registeredUsers)
                .onboardingCompleted(onboardingCompleted)
                .intentIntercambiar(intentIntercambiar)
                .intentVender(intentVender)
                .intentComprar(intentComprar)
                .firstBookUploaded(firstBookUploaded)
                .conversionRate(conversionRate)
                .avgMinutesToFirstBook(avgMinutes)
                .build();
    }

    @Transactional
    public void deleteBook(UUID bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new AppException("Libro no encontrado", HttpStatus.NOT_FOUND));
        bookRepository.delete(book);
    }

    private AdminUserResponse toUserResponse(User user, long bookCount) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .active(user.isActive())
                .emailVerified(user.isEmailVerified())
                .bookCount(bookCount)
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AdminBookResponse toBookResponse(Book book) {
        return AdminBookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .genre(book.getGenre())
                .condition(book.getCondition().name())
                .status(book.getStatus().name())
                .coverImageUrl(book.getCoverImageUrl())
                .owner(AdminBookResponse.OwnerInfo.builder()
                        .id(book.getOwner().getId())
                        .name(book.getOwner().getName())
                        .email(book.getOwner().getEmail())
                        .build())
                .createdAt(book.getCreatedAt())
                .build();
    }
}
