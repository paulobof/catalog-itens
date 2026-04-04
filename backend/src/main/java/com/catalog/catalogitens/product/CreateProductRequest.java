package com.catalog.catalogitens.product;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateProductRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 150, message = "Name must not exceed 150 characters")
        String name,

        String description,

        List<UUID> tagIds,

        List<ProductLocationEntry> locations
) {
    public record ProductLocationEntry(
            @NotNull(message = "locationId is required")
            UUID locationId,

            @Min(value = 1, message = "Quantity must be at least 1")
            @Max(value = 99999, message = "Quantity must not exceed 99999")
            int quantity
    ) {}
}
