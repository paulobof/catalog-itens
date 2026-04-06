package com.catalog.catalogitens.photo;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record PhotoReorderRequest(
        @NotEmpty(message = "Lista de fotos não pode estar vazia")
        @Valid
        List<PhotoSortEntry> photos
) {
    public record PhotoSortEntry(
            @NotNull(message = "photoId é obrigatório")
            UUID photoId,

            int sortOrder
    ) {}
}
