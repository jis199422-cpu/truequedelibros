package com.jis.truequedelibros.user.controller;

import com.jis.truequedelibros.auth.dto.UserResponse;
import com.jis.truequedelibros.auth.service.AuthService;
import com.jis.truequedelibros.book.dto.BookResponse;
import com.jis.truequedelibros.book.dto.UploadUrlRequest;
import com.jis.truequedelibros.book.dto.UploadUrlResponse;
import com.jis.truequedelibros.book.service.BookService;
import com.jis.truequedelibros.conversation.websocket.PresenceService;
import com.jis.truequedelibros.storage.S3StorageService;
import com.jis.truequedelibros.user.domain.User;
import com.jis.truequedelibros.user.dto.LocationRequest;
import com.jis.truequedelibros.user.dto.PublicProfileResponse;
import com.jis.truequedelibros.user.dto.UpdateUserRequest;
import com.jis.truequedelibros.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final BookService bookService;
    private final AuthService authService;
    private final S3StorageService s3StorageService;
    private final PresenceService presenceService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.updateProfile(user.getId(), request));
    }

    @PutMapping("/me/location")
    public ResponseEntity<Void> updateLocation(
            @Valid @RequestBody LocationRequest request,
            @AuthenticationPrincipal User user) {
        userService.updateLocation(user.getId(), request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/me/avatar-url")
    public ResponseEntity<UploadUrlResponse> getAvatarUploadUrl(
            @Valid @RequestBody UploadUrlRequest request) {
        return ResponseEntity.ok(s3StorageService.generateUploadUrl(
                "avatars", request.getFileName(), request.getContentType()));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<PublicProfileResponse> getPublicProfile(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getPublicProfile(userId));
    }

    @GetMapping("/{userId}/books")
    public ResponseEntity<List<BookResponse>> getUserBooks(@PathVariable UUID userId) {
        return ResponseEntity.ok(bookService.getByOwner(userId));
    }

    @GetMapping("/{userId}/online")
    public ResponseEntity<Map<String, Boolean>> isOnline(@PathVariable UUID userId) {
        return ResponseEntity.ok(Map.of("online", presenceService.isOnline(userId)));
    }

    @PostMapping("/me/subscription-interest")
    public ResponseEntity<Void> saveSubscriptionInterest(
            @RequestBody java.util.Map<String, Boolean> body,
            @AuthenticationPrincipal User user) {
        userService.saveSubscriptionInterest(user.getId(), Boolean.TRUE.equals(body.get("interested")));
        return ResponseEntity.noContent().build();
    }

}
