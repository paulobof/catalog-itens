package com.catalog.catalogitens.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record UpdateProductRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome não pode exceder 150 caracteres")
        String name,

        @Size(max = 2000, message = "Descrição não pode exceder 2000 caracteres")
        String description,

        List<UUID> tagIds
) {}
