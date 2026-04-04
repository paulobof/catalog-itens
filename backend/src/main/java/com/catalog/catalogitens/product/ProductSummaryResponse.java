package com.catalog.catalogitens.product;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProductSummaryResponse(
        UUID id,
        String name,
        String description,
        List<TagEntry> tags,
        List<LocationEntry> locations,
        int totalQuantity,
        String thumbnailUrl,
        Instant createdAt,
        Instant updatedAt
) {
    public record TagEntry(UUID id, String name, String color) {}
    public record LocationEntry(UUID locationId, String locationName, UUID roomId, String roomName, int quantity) {}
}
