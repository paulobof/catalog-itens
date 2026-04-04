package com.catalog.catalogitens.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductLocationRepository extends JpaRepository<ProductLocation, UUID> {

    @Query("""
            SELECT pl FROM ProductLocation pl
            WHERE pl.product.id = :productId
            AND pl.deletedAt IS NULL
            """)
    List<ProductLocation> findActiveByProductId(@Param("productId") UUID productId);

    @Query("""
            SELECT pl FROM ProductLocation pl
            WHERE pl.product.id = :productId
            AND pl.location.id = :locationId
            AND pl.deletedAt IS NULL
            """)
    Optional<ProductLocation> findActiveByProductIdAndLocationId(
            @Param("productId") UUID productId,
            @Param("locationId") UUID locationId);

    @Modifying(clearAutomatically = true)
    @Query(value = """
            UPDATE product_location SET deleted_at = now()
            WHERE location_id IN (
                SELECT id FROM location WHERE room_id = :roomId
            ) AND deleted_at IS NULL
            """, nativeQuery = true)
    int softDeleteByRoomId(@Param("roomId") UUID roomId);

    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE product_location SET deleted_at = now() WHERE location_id = :locationId AND deleted_at IS NULL",
           nativeQuery = true)
    int softDeleteByLocationId(@Param("locationId") UUID locationId);

    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE product_location SET deleted_at = now() WHERE product_id = :productId AND deleted_at IS NULL",
           nativeQuery = true)
    int softDeleteByProductId(@Param("productId") UUID productId);
}
