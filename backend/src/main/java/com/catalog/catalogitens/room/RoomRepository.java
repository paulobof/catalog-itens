package com.catalog.catalogitens.room;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {

    @EntityGraph(attributePaths = "locations")
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findWithLocationsById(@Param("id") UUID id);

    @Query("""
            SELECT r FROM Room r
            ORDER BY r.name ASC
            """)
    List<Room> findAllActive();

    @Query(value = "SELECT COUNT(*) FROM location WHERE room_id = :roomId AND deleted_at IS NULL",
           nativeQuery = true)
    long countActiveLocationsByRoomId(@Param("roomId") UUID roomId);

    @Query(value = """
            SELECT COUNT(DISTINCT pl.product_id) FROM product_location pl
            JOIN location l ON pl.location_id = l.id
            WHERE l.room_id = :roomId AND pl.deleted_at IS NULL AND l.deleted_at IS NULL
            """, nativeQuery = true)
    long countActiveProductsByRoomId(@Param("roomId") UUID roomId);

    @Query(value = """
            SELECT l.room_id AS roomId, COUNT(*) AS cnt
            FROM location l
            WHERE l.room_id IN :roomIds AND l.deleted_at IS NULL
            GROUP BY l.room_id
            """, nativeQuery = true)
    List<Object[]> countActiveLocationsByRoomIds(@Param("roomIds") List<UUID> roomIds);

    @Query(value = """
            SELECT l.room_id AS roomId, COUNT(DISTINCT pl.product_id) AS cnt
            FROM location l
            JOIN product_location pl ON pl.location_id = l.id AND pl.deleted_at IS NULL
            WHERE l.room_id IN :roomIds AND l.deleted_at IS NULL
            GROUP BY l.room_id
            """, nativeQuery = true)
    List<Object[]> countActiveProductsByRoomIds(@Param("roomIds") List<UUID> roomIds);
}
