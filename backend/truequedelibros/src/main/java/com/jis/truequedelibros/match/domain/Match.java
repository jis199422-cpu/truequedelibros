package com.jis.truequedelibros.match.domain;

import com.jis.truequedelibros.book.domain.Book;
import com.jis.truequedelibros.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "matches")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_a_id", nullable = false)
    private User userA; // who completed the match

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_b_id", nullable = false)
    private User userB;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_a_id", nullable = false)
    private Book bookA; // book from userA that userB liked

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_b_id", nullable = false)
    private Book bookB; // book from userB that userA liked

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
