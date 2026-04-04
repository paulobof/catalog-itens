package com.catalog.catalogitens.product;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateProductLocationRequest(
        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 99999, message = "Quantity must not exceed 99999")
        int quantity
) {}
