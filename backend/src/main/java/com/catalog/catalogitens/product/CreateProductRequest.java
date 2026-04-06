package com.catalog.catalogitens.product;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateProductRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome não pode exceder 150 caracteres")
        String name,

        @Size(max = 2000, message = "Descrição não pode exceder 2000 caracteres")
        String description,

        List<UUID> tagIds,

        List<ProductLocationEntry> locations
) {
    public record ProductLocationEntry(
            @NotNull(message = "locationId é obrigatório")
            UUID locationId,

            @Min(value = 1, message = "Quantidade deve ser no mínimo 1")
            @Max(value = 99999, message = "Quantidade não pode exceder 99999")
            int quantity
    ) {}
}
