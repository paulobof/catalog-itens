package com.catalog.catalogitens.room;

import com.catalog.catalogitens.location.LocationSummaryResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RoomDetailResponse(
        UUID id,
        String name,
        String description,
        List<LocationSummaryResponse> locations,
        long locationCount,
        long productCount,
        Instant createdAt,
        Instant updatedAt
) {}
