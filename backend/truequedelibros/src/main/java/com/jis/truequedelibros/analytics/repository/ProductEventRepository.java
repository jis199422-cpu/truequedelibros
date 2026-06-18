package com.jis.truequedelibros.analytics.repository;

import com.jis.truequedelibros.analytics.domain.ProductEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ProductEventRepository extends JpaRepository<ProductEvent, UUID> {

    long countByEventName(String eventName);

    long countByEventNameAndUserId(String eventName, UUID userId);

    @Query(value = """
            SELECT COUNT(DISTINCT pe.user_id)
            FROM product_events pe
            WHERE pe.event_name = :eventName
            """, nativeQuery = true)
    long countDistinctUsersByEventName(@Param("eventName") String eventName);

    @Query(value = """
            SELECT EXTRACT(EPOCH FROM AVG(pe.created_at - u.created_at)) / 60.0
            FROM product_events pe
            JOIN users u ON u.id = pe.user_id
            WHERE pe.event_name = :eventName
            """, nativeQuery = true)
    Double avgMinutesFromRegistration(@Param("eventName") String eventName);
}
