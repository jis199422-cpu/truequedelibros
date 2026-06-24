package com.jis.truequedelibros.user.domain;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    private String passwordHash;

    private String googleId;

    @Column(nullable = false)
    private String name;

    private String bio;

    private String city;

    private Double latitude;

    private Double longitude;

    private String profilePictureUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    private Boolean subscriptionInterest;

    @Column(nullable = false)
    @Builder.Default
    private boolean premium = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime lastLogin;

    @Column(nullable = false)
    @Builder.Default
    private boolean onboardingCompleted = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "onboarding_intent")
    private OnboardingIntent onboardingIntent;

    @Column(name = "onboarding_notes", length = 500)
    private String onboardingNotes;

    @Column(name = "wishlist_notify_on_match", nullable = false)
    @Builder.Default
    private boolean wishlistNotifyOnMatch = true;

    @Column(name = "wishlist_notify_external_purchase", nullable = false)
    @Builder.Default
    private boolean wishlistNotifyExternalPurchase = false;

    @Column(name = "notify_on_new_message", nullable = false)
    @Builder.Default
    private boolean notifyOnNewMessage = true;

    @Column(name = "notify_on_book_like", nullable = false)
    @Builder.Default
    private boolean notifyOnBookLike = true;

    @Column(name = "terms_accepted_at")
    private LocalDateTime termsAcceptedAt;

    @PrePersist
    void prePersist() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isEnabled() {
        return emailVerified;
    }
}
