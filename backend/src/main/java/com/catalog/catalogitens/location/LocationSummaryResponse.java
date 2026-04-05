package com.catalog.catalogitens.location;

import java.time.Instant;
import java.util.UUID;

public record LocationSummaryResponse(
        UUID id,
        UUID roomId,
        String roomName,
        String name,
        String description,
        long productCount,
        String thumbnailUrl,
        Instant createdAt,
        Instant updatedAt
) {
    public static LocationSummaryResponse from(Location location, long productCount, String thumbnailUrl) {
        return new LocationSummaryResponse(
                location.getId(),
                location.getRoom().getId(),
                location.getRoom().getName(),
                location.getName(),
                location.getDescription(),
                productCount,
                thumbnailUrl,
                location.getCreatedAt(),
                location.getUpdatedAt()
        );
    }
}
