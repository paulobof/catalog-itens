package com.catalog.catalogitens.location;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {

    @Query("""
            SELECT l FROM Location l
            WHERE l.room.id = :roomId
            ORDER BY l.name ASC
            """)
    List<Location> findAllByRoomId(@Param("roomId") UUID roomId);

    @Query("SELECT l FROM Location l ORDER BY l.name ASC")
    List<Location> findAllActive();

    @EntityGraph(attributePaths = {"room", "productLocations", "productLocations.product"})
    @Query("SELECT l FROM Location l WHERE l.id = :id")
    Optional<Location> findWithProductsById(@Param("id") UUID id);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "UPDATE location SET deleted_at = now() WHERE room_id = :roomId AND deleted_at IS NULL",
           nativeQuery = true)
    int softDeleteByRoomId(@Param("roomId") UUID roomId);

    @Query(value = "SELECT COUNT(*) FROM product_location WHERE location_id = :locationId AND deleted_at IS NULL",
           nativeQuery = true)
    long countActiveProductsByLocationId(@Param("locationId") UUID locationId);
}
