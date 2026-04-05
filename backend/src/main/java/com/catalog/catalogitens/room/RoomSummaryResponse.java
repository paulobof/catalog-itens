package com.catalog.catalogitens.room;

import java.time.Instant;
import java.util.UUID;

public record RoomSummaryResponse(
        UUID id,
        String name,
        String description,
        long locationCount,
        long productCount,
        String thumbnailUrl,
        Instant createdAt,
        Instant updatedAt
) {
    public static RoomSummaryResponse from(Room room, long locationCount, long productCount, String thumbnailUrl) {
        return new RoomSummaryResponse(
                room.getId(),
                room.getName(),
                room.getDescription(),
                locationCount,
                productCount,
                thumbnailUrl,
                room.getCreatedAt(),
                room.getUpdatedAt()
        );
    }
}
