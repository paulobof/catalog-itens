package com.catalog.catalogitens.product;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProductDetailResponse(
        UUID id,
        String name,
        String description,
        List<TagEntry> tags,
        List<LocationEntry> locations,
        List<PhotoEntry> photos,
        int totalQuantity,
        Instant createdAt,
        Instant updatedAt
) {
    public record TagEntry(UUID id, String name, String color) {}
    public record LocationEntry(UUID productLocationId, UUID locationId, String locationName,
                                 UUID roomId, String roomName, int quantity) {}
    public record PhotoEntry(UUID id, String url, String thumbnailUrl,
                              String originalFilename, long fileSize, int sortOrder) {}
}
