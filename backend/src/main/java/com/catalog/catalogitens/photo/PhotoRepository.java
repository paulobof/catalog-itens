package com.catalog.catalogitens.photo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, UUID> {

    @Query("""
            SELECT p FROM Photo p
            WHERE p.entityType = :entityType AND p.entityId = :entityId
            ORDER BY p.sortOrder ASC, p.createdAt ASC
            """)
    List<Photo> findActiveByEntityTypeAndEntityId(@Param("entityType") String entityType,
                                                   @Param("entityId") UUID entityId);

    @Query("""
            SELECT COUNT(p) FROM Photo p
            WHERE p.entityType = :entityType AND p.entityId = :entityId
            """)
    long countActiveByEntityTypeAndEntityId(@Param("entityType") String entityType,
                                             @Param("entityId") UUID entityId);

    @Modifying(clearAutomatically = true)
    @Query(value = """
            UPDATE photo SET deleted_at = now()
            WHERE entity_type = :entityType AND entity_id = :entityId AND deleted_at IS NULL
            """, nativeQuery = true)
    int softDeleteAllByEntityTypeAndEntityId(@Param("entityType") String entityType,
                                              @Param("entityId") UUID entityId);
}
