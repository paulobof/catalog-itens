package com.catalog.catalogitens.location;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record LocationDetailResponse(
        UUID id,
        UUID roomId,
        String roomName,
        String name,
        String description,
        List<LocationProductEntry> products,
        long productCount,
        Instant createdAt,
        Instant updatedAt
) {
    public record LocationProductEntry(
            UUID productId,
            String productName,
            int quantity
    ) {}
}
