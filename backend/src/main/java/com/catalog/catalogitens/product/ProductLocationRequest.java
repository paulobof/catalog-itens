package com.catalog.catalogitens.product;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ProductLocationRequest(
        @NotNull(message = "locationId é obrigatório")
        UUID locationId,

        @Min(value = 1, message = "Quantidade deve ser no mínimo 1")
        @Max(value = 99999, message = "Quantidade não pode exceder 99999")
        int quantity
) {}
