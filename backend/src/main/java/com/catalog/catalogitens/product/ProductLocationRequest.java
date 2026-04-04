package com.catalog.catalogitens.product;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ProductLocationRequest(
        @NotNull(message = "locationId is required")
        UUID locationId,

        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 99999, message = "Quantity must not exceed 99999")
        int quantity
) {}
