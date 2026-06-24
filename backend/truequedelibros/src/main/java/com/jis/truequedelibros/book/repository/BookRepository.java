package com.jis.truequedelibros.book.repository;

import com.jis.truequedelibros.book.domain.Book;
import com.jis.truequedelibros.book.domain.BookStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface BookRepository extends JpaRepository<Book, UUID> {

    List<Book> findByOwner_IdOrderByCreatedAtDesc(UUID ownerId);

    List<Book> findByLocal_IdOrderByCreatedAtDesc(UUID localId);

    long countByOwner_Id(UUID ownerId);

    boolean existsByOwner_Id(UUID ownerId);

    boolean existsByOwner_IdAndStatus(UUID ownerId, BookStatus status);

    boolean existsByOwner_IdAndStatusAndTrueque(UUID ownerId, BookStatus status, boolean trueque);

    @Query(value = """
            SELECT b.* FROM books b
            JOIN users u ON b.owner_id = u.id
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            ORDER BY CASE
                WHEN u.latitude IS NOT NULL AND u.longitude IS NOT NULL
                THEN (6371 * acos(LEAST(1.0,
                    cos(radians(:lat)) * cos(radians(u.latitude))
                    * cos(radians(u.longitude) - radians(:lng))
                    + sin(radians(:lat)) * sin(radians(u.latitude))
                )))
                ELSE 9999.0
            END ASC,
            CASE
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND LOWER(b.title) = LOWER(wi.book_title)) THEN 0
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND (LOWER(b.title) LIKE LOWER(CONCAT('%', wi.book_title, '%'))
                         OR LOWER(wi.book_title) LIKE LOWER(CONCAT('%', b.title, '%')))) THEN 1
                ELSE 2
            END ASC,
            CASE WHEN u.premium = true THEN 0 ELSE 1 END ASC,
            b.id ASC
            """,
            countQuery = """
            SELECT COUNT(b.id) FROM books b
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            """,
            nativeQuery = true)
    Page<Book> findFeedByProximity(@Param("userId") UUID userId,
                                   @Param("lat") double lat,
                                   @Param("lng") double lng,
                                   Pageable pageable);

    @Query(value = """
            SELECT b.* FROM books b
            JOIN users u ON b.owner_id = u.id
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            ORDER BY CASE
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND LOWER(b.title) = LOWER(wi.book_title)) THEN 0
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND (LOWER(b.title) LIKE LOWER(CONCAT('%', wi.book_title, '%'))
                         OR LOWER(wi.book_title) LIKE LOWER(CONCAT('%', b.title, '%')))) THEN 1
                ELSE 2
            END ASC,
            CASE WHEN u.premium = true THEN 0 ELSE 1 END ASC,
            b.created_at DESC,
            b.id ASC
            """,
            countQuery = """
            SELECT COUNT(b.id) FROM books b
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            """,
            nativeQuery = true)
    Page<Book> findFeedBasic(@Param("userId") UUID userId,
                             Pageable pageable);

    @Query(value = """
            SELECT b.* FROM books b
            JOIN users u ON b.owner_id = u.id
            WHERE b.status = 'AVAILABLE'
            ORDER BY CASE WHEN u.premium = true THEN 0 ELSE 1 END ASC,
            b.created_at DESC,
            b.id ASC
            """,
           countQuery = """
            SELECT COUNT(b.id) FROM books b
            WHERE b.status = 'AVAILABLE'
            """,
           nativeQuery = true)
    Page<Book> findFeedGuest(Pageable pageable);

    @Query(value = """
            SELECT b.* FROM books b
            JOIN users u ON b.owner_id = u.id
            WHERE b.status = 'AVAILABLE'
            ORDER BY CASE
                WHEN u.latitude IS NOT NULL AND u.longitude IS NOT NULL
                THEN (6371 * acos(LEAST(1.0,
                    cos(radians(:lat)) * cos(radians(u.latitude))
                    * cos(radians(u.longitude) - radians(:lng))
                    + sin(radians(:lat)) * sin(radians(u.latitude))
                )))
                ELSE 9999.0
            END ASC,
            CASE WHEN u.premium = true THEN 0 ELSE 1 END ASC,
            b.id ASC
            """,
            countQuery = """
            SELECT COUNT(b.id) FROM books b
            WHERE b.status = 'AVAILABLE'
            """,
            nativeQuery = true)
    Page<Book> findFeedGuestByProximity(@Param("lat") double lat,
                                        @Param("lng") double lng,
                                        Pageable pageable);

    @Query(value = """
            SELECT b.* FROM books b
            JOIN users u ON b.owner_id = u.id
            WHERE b.status = 'AVAILABLE'
              AND b.genre = :genre
            ORDER BY CASE
                WHEN u.latitude IS NOT NULL AND u.longitude IS NOT NULL
                THEN (6371 * acos(LEAST(1.0,
                    cos(radians(:lat)) * cos(radians(u.latitude))
                    * cos(radians(u.longitude) - radians(:lng))
                    + sin(radians(:lat)) * sin(radians(u.latitude))
                )))
                ELSE 9999.0
            END ASC,
            CASE WHEN u.premium = true THEN 0 ELSE 1 END ASC,
            b.id ASC
            """,
            countQuery = """
            SELECT COUNT(b.id) FROM books b
            WHERE b.status = 'AVAILABLE' AND b.genre = :genre
            """,
            nativeQuery = true)
    Page<Book> findFeedGuestByProximityAndGenre(@Param("lat") double lat,
                                                @Param("lng") double lng,
                                                @Param("genre") String genre,
                                                Pageable pageable);

    @Query(value = """
            SELECT b.* FROM books b
            JOIN users u ON b.owner_id = u.id
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND b.genre = :genre
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            ORDER BY CASE
                WHEN u.latitude IS NOT NULL AND u.longitude IS NOT NULL
                THEN (6371 * acos(LEAST(1.0,
                    cos(radians(:lat)) * cos(radians(u.latitude))
                    * cos(radians(u.longitude) - radians(:lng))
                    + sin(radians(:lat)) * sin(radians(u.latitude))
                )))
                ELSE 9999.0
            END ASC,
            CASE
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND LOWER(b.title) = LOWER(wi.book_title)) THEN 0
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND (LOWER(b.title) LIKE LOWER(CONCAT('%', wi.book_title, '%'))
                         OR LOWER(wi.book_title) LIKE LOWER(CONCAT('%', b.title, '%')))) THEN 1
                ELSE 2
            END ASC,
            CASE WHEN u.premium = true THEN 0 ELSE 1 END ASC,
            b.id ASC
            """,
            countQuery = """
            SELECT COUNT(b.id) FROM books b
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND b.genre = :genre
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            """,
            nativeQuery = true)
    Page<Book> findFeedByProximityAndGenre(@Param("userId") UUID userId,
                                           @Param("lat") double lat,
                                           @Param("lng") double lng,
                                           @Param("genre") String genre,
                                           Pageable pageable);

    @Query(value = """
            SELECT b.* FROM books b
            JOIN users u ON b.owner_id = u.id
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND b.genre = :genre
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            ORDER BY CASE
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND LOWER(b.title) = LOWER(wi.book_title)) THEN 0
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND (LOWER(b.title) LIKE LOWER(CONCAT('%', wi.book_title, '%'))
                         OR LOWER(wi.book_title) LIKE LOWER(CONCAT('%', b.title, '%')))) THEN 1
                ELSE 2
            END ASC,
            CASE WHEN u.premium = true THEN 0 ELSE 1 END ASC,
            b.created_at DESC,
            b.id ASC
            """,
            countQuery = """
            SELECT COUNT(b.id) FROM books b
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND b.genre = :genre
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            """,
            nativeQuery = true)
    Page<Book> findFeedBasicAndGenre(@Param("userId") UUID userId,
                                     @Param("genre") String genre,
                                     Pageable pageable);

    @Query(value = """
            SELECT b.* FROM books b
            JOIN users u ON b.owner_id = u.id
            WHERE b.status = 'AVAILABLE'
              AND b.genre = :genre
            ORDER BY CASE WHEN u.premium = true THEN 0 ELSE 1 END ASC,
            b.created_at DESC,
            b.id ASC
            """,
           countQuery = """
            SELECT COUNT(b.id) FROM books b
            WHERE b.status = 'AVAILABLE' AND b.genre = :genre
            """,
           nativeQuery = true)
    Page<Book> findFeedGuestAndGenre(@Param("genre") String genre,
                                     Pageable pageable);

    List<Book> findAllByOrderByCreatedAtDesc();

    long countByStatus(BookStatus status);

    long countByOwner_IdAndTruequeTrue(UUID ownerId);

    @Query("SELECT b.owner.id, COUNT(b) FROM Book b GROUP BY b.owner.id")
    List<Object[]> countBooksByOwner();

    // Feed queries for users without books (only regalo/venta)
    @Query(value = """
            SELECT b.* FROM books b
            JOIN users u ON b.owner_id = u.id
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND (b.regalo = true OR b.venta = true)
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            ORDER BY CASE
                WHEN u.latitude IS NOT NULL AND u.longitude IS NOT NULL
                THEN (6371 * acos(LEAST(1.0,
                    cos(radians(:lat)) * cos(radians(u.latitude))
                    * cos(radians(u.longitude) - radians(:lng))
                    + sin(radians(:lat)) * sin(radians(u.latitude))
                )))
                ELSE 9999.0
            END ASC,
            CASE
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND LOWER(b.title) = LOWER(wi.book_title)) THEN 0
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND (LOWER(b.title) LIKE LOWER(CONCAT('%', wi.book_title, '%'))
                         OR LOWER(wi.book_title) LIKE LOWER(CONCAT('%', b.title, '%')))) THEN 1
                ELSE 2
            END ASC,
            CASE WHEN u.premium = true THEN 0 ELSE 1 END ASC,
            b.id ASC
            """,
            countQuery = """
            SELECT COUNT(b.id) FROM books b
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND (b.regalo = true OR b.venta = true)
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            """,
            nativeQuery = true)
    Page<Book> findFeedByProximityNoTrueque(@Param("userId") UUID userId,
                                             @Param("lat") double lat,
                                             @Param("lng") double lng,
                                             Pageable pageable);

    @Query(value = """
            SELECT b.* FROM books b
            JOIN users u ON b.owner_id = u.id
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND (b.regalo = true OR b.venta = true)
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            ORDER BY CASE
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND LOWER(b.title) = LOWER(wi.book_title)) THEN 0
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND (LOWER(b.title) LIKE LOWER(CONCAT('%', wi.book_title, '%'))
                         OR LOWER(wi.book_title) LIKE LOWER(CONCAT('%', b.title, '%')))) THEN 1
                ELSE 2
            END ASC,
            CASE WHEN u.premium = true THEN 0 ELSE 1 END ASC,
            b.created_at DESC, b.id ASC
            """,
            countQuery = """
            SELECT COUNT(b.id) FROM books b
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND (b.regalo = true OR b.venta = true)
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            """,
            nativeQuery = true)
    Page<Book> findFeedBasicNoTrueque(@Param("userId") UUID userId,
                                       Pageable pageable);

    @Query(value = """
            SELECT b.* FROM books b
            JOIN users u ON b.owner_id = u.id
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND b.genre = :genre
              AND (b.regalo = true OR b.venta = true)
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            ORDER BY CASE
                WHEN u.latitude IS NOT NULL AND u.longitude IS NOT NULL
                THEN (6371 * acos(LEAST(1.0,
                    cos(radians(:lat)) * cos(radians(u.latitude))
                    * cos(radians(u.longitude) - radians(:lng))
                    + sin(radians(:lat)) * sin(radians(u.latitude))
                )))
                ELSE 9999.0
            END ASC,
            CASE
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND LOWER(b.title) = LOWER(wi.book_title)) THEN 0
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND (LOWER(b.title) LIKE LOWER(CONCAT('%', wi.book_title, '%'))
                         OR LOWER(wi.book_title) LIKE LOWER(CONCAT('%', b.title, '%')))) THEN 1
                ELSE 2
            END ASC,
            CASE WHEN u.premium = true THEN 0 ELSE 1 END ASC,
            b.id ASC
            """,
            countQuery = """
            SELECT COUNT(b.id) FROM books b
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND b.genre = :genre
              AND (b.regalo = true OR b.venta = true)
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            """,
            nativeQuery = true)
    Page<Book> findFeedByProximityAndGenreNoTrueque(@Param("userId") UUID userId,
                                                     @Param("lat") double lat,
                                                     @Param("lng") double lng,
                                                     @Param("genre") String genre,
                                                     Pageable pageable);

    @Query(value = """
            SELECT b.* FROM books b
            JOIN users u ON b.owner_id = u.id
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND b.genre = :genre
              AND (b.regalo = true OR b.venta = true)
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            ORDER BY CASE
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND LOWER(b.title) = LOWER(wi.book_title)) THEN 0
                WHEN EXISTS (SELECT 1 FROM wishlist_items wi WHERE wi.user_id = :userId
                    AND (LOWER(b.title) LIKE LOWER(CONCAT('%', wi.book_title, '%'))
                         OR LOWER(wi.book_title) LIKE LOWER(CONCAT('%', b.title, '%')))) THEN 1
                ELSE 2
            END ASC,
            CASE WHEN u.premium = true THEN 0 ELSE 1 END ASC,
            b.created_at DESC, b.id ASC
            """,
            countQuery = """
            SELECT COUNT(b.id) FROM books b
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND b.genre = :genre
              AND (b.regalo = true OR b.venta = true)
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            """,
            nativeQuery = true)
    Page<Book> findFeedBasicAndGenreNoTrueque(@Param("userId") UUID userId,
                                               @Param("genre") String genre,
                                               Pageable pageable);

    @Query(value = """
            SELECT COUNT(b.id) FROM books b
            WHERE b.status = 'AVAILABLE'
              AND b.owner_id != :userId
              AND NOT (b.regalo = true OR b.venta = true)
              AND NOT EXISTS (
                  SELECT 1 FROM book_likes bl WHERE bl.book_id = b.id AND bl.liker_id = :userId
              )
              AND NOT EXISTS (
                  SELECT 1 FROM book_dislikes bd WHERE bd.book_id = b.id AND bd.disliker_id = :userId
              )
            """,
            nativeQuery = true)
    long countFeedTruequeOnly(@Param("userId") UUID userId);
}
