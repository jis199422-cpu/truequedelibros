package com.jis.truequedelibros.wishlist.controller;

import com.jis.truequedelibros.user.domain.User;
import com.jis.truequedelibros.wishlist.dto.AddWishlistRequest;
import com.jis.truequedelibros.wishlist.dto.WishlistItemResponse;
import com.jis.truequedelibros.wishlist.service.WishlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<List<WishlistItemResponse>> getWishlist(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(wishlistService.getForUser(user.getId()));
    }

    @PostMapping
    public ResponseEntity<WishlistItemResponse> addToWishlist(
            @Valid @RequestBody AddWishlistRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(wishlistService.add(request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeFromWishlist(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        wishlistService.remove(id, user);
        return ResponseEntity.noContent().build();
    }
}
