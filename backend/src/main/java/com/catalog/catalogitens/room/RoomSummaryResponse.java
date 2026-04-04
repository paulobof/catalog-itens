package com.catalog.catalogitens.room;

import java.time.Instant;
import java.util.UUID;

public record RoomSummaryResponse(
        UUID id,
        String name,
        String description,
        long locationCount,
        long productCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static RoomSummaryResponse from(Room room, long locationCount, long productCount) {
        return new RoomSummaryResponse(
                room.getId(),
                room.getName(),
                room.getDescription(),
                locationCount,
                productCount,
                room.getCreatedAt(),
                room.getUpdatedAt()
        );
    }
}
