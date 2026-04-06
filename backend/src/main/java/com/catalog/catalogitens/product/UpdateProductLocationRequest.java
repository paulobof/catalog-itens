package com.catalog.catalogitens.product;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateProductLocationRequest(
        @Min(value = 1, message = "Quantidade deve ser no mínimo 1")
        @Max(value = 99999, message = "Quantidade não pode exceder 99999")
        int quantity
) {}
