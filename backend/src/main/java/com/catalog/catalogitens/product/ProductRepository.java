package com.catalog.catalogitens.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    @EntityGraph(attributePaths = {"productLocations", "productLocations.location",
            "productLocations.location.room", "productTags", "productTags.tag"})
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findWithDetailsById(@Param("id") UUID id);

    // Full-text search with optional room and tag filters, pagination
    @Query(value = """
            SELECT p.* FROM product p
            WHERE p.deleted_at IS NULL
              AND (
                :q IS NULL
                OR (length(:q) >= 3 AND p.search_vector @@ plainto_tsquery('portuguese', :q))
                OR (length(:q) < 3  AND p.name ILIKE '%' || :q || '%')
              )
              AND (
                :roomId IS NULL
                OR EXISTS (
                    SELECT 1 FROM product_location pl
                    JOIN location l ON pl.location_id = l.id
                    WHERE pl.product_id = p.id
                      AND pl.deleted_at IS NULL
                      AND l.room_id = CAST(:roomId AS uuid)
                      AND l.deleted_at IS NULL
                )
              )
              AND (
                :tagId IS NULL
                OR EXISTS (
                    SELECT 1 FROM product_tag pt
                    WHERE pt.product_id = p.id
                      AND pt.tag_id = CAST(:tagId AS uuid)
                )
              )
            ORDER BY p.name ASC, p.id ASC
            """,
            countQuery = """
            SELECT COUNT(p.id) FROM product p
            WHERE p.deleted_at IS NULL
              AND (
                :q IS NULL
                OR (length(:q) >= 3 AND p.search_vector @@ plainto_tsquery('portuguese', :q))
                OR (length(:q) < 3  AND p.name ILIKE '%' || :q || '%')
              )
              AND (
                :roomId IS NULL
                OR EXISTS (
                    SELECT 1 FROM product_location pl
                    JOIN location l ON pl.location_id = l.id
                    WHERE pl.product_id = p.id
                      AND pl.deleted_at IS NULL
                      AND l.room_id = CAST(:roomId AS uuid)
                      AND l.deleted_at IS NULL
                )
              )
              AND (
                :tagId IS NULL
                OR EXISTS (
                    SELECT 1 FROM product_tag pt
                    WHERE pt.product_id = p.id
                      AND pt.tag_id = CAST(:tagId AS uuid)
                )
              )
            """,
            nativeQuery = true)
    Page<Product> searchProducts(@Param("q") String q,
                                  @Param("roomId") UUID roomId,
                                  @Param("tagId") UUID tagId,
                                  Pageable pageable);
}
