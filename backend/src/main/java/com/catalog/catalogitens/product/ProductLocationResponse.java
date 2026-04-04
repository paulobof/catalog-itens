package com.catalog.catalogitens.product;

import java.time.Instant;
import java.util.UUID;

public record ProductLocationResponse(
        UUID id,
        UUID productId,
        UUID locationId,
        String locationName,
        UUID roomId,
        String roomName,
        int quantity,
        Instant createdAt,
        Instant updatedAt
) {}
