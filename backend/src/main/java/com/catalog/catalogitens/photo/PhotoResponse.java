package com.catalog.catalogitens.photo;

import java.time.Instant;
import java.util.UUID;

public record PhotoResponse(
        UUID id,
        String entityType,
        UUID entityId,
        String url,
        String thumbnailUrl,
        String originalFilename,
        String contentType,
        long fileSize,
        int sortOrder,
        Instant createdAt
) {}
