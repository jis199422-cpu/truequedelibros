package com.jis.truequedelibros.wishlist.service;

import com.jis.truequedelibros.auth.service.EmailService;
import com.jis.truequedelibros.book.domain.Book;
import com.jis.truequedelibros.notification.service.NotificationService;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.User;
import com.jis.truequedelibros.wishlist.domain.WishlistItem;
import com.jis.truequedelibros.wishlist.dto.AddWishlistRequest;
import com.jis.truequedelibros.wishlist.dto.WishlistItemResponse;
import com.jis.truequedelibros.wishlist.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private static final double NEARBY_KM = 100.0;

    private final WishlistRepository wishlistRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<WishlistItemResponse> getForUser(UUID userId) {
        return wishlistRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public WishlistItemResponse add(AddWishlistRequest request, User user) {
        if (wishlistRepository.existsByUser_IdAndBookTitleIgnoreCase(user.getId(), request.getBookTitle())) {
            throw new AppException("Ya tienes este título en tu lista de deseos", HttpStatus.CONFLICT);
        }
        WishlistItem item = wishlistRepository.save(WishlistItem.builder()
                .user(user)
                .bookTitle(request.getBookTitle())
                .build());
        if (user.isWishlistNotifyExternalPurchase()) {
            emailService.sendExternalPurchaseRequestEmail(user, List.of(request.getBookTitle()));
        }
        return toResponse(item);
    }

    @Transactional
    public void remove(UUID itemId, User user) {
        WishlistItem item = wishlistRepository.findById(itemId)
                .orElseThrow(() -> new AppException("Elemento no encontrado", HttpStatus.NOT_FOUND));
        if (!item.getUser().getId().equals(user.getId())) {
            throw new AppException("No tienes permiso para eliminar este elemento", HttpStatus.FORBIDDEN);
        }
        wishlistRepository.delete(item);
    }

    @Async
    @Transactional(readOnly = true)
    public void notifyInterestedUsers(Book book) {
        List<WishlistItem> interested = wishlistRepository.findByBookTitleIgnoreCase(book.getTitle());
        User owner = book.getOwner();

        interested.stream()
                .filter(item -> !item.getUser().getId().equals(owner.getId()))
                .filter(item -> isNearby(owner, item.getUser()))
                .forEach(item -> {
                    notificationService.notifyWishlistMatch(
                            item.getUser(), book.getTitle(), owner.getCity(), book.getId());
                    if (item.getUser().isWishlistNotifyOnMatch()) {
                        emailService.sendWishlistNotificationEmail(
                                item.getUser().getEmail(),
                                item.getUser().getName(),
                                book.getTitle(),
                                owner.getName(),
                                owner.getCity());
                    }
                });
    }

    private boolean isNearby(User owner, User candidate) {
        if (owner.getLatitude() == null || owner.getLongitude() == null
                || candidate.getLatitude() == null || candidate.getLongitude() == null) {
            return true;
        }
        return haversineKm(owner.getLatitude(), owner.getLongitude(),
                candidate.getLatitude(), candidate.getLongitude()) <= NEARBY_KM;
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private WishlistItemResponse toResponse(WishlistItem item) {
        return WishlistItemResponse.builder()
                .id(item.getId())
                .bookTitle(item.getBookTitle())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
