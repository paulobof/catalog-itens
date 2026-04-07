package com.catalog.catalogitens.location;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateLocationRequest(
        @NotNull(message = "roomId é obrigatório")
        UUID roomId,

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome não pode exceder 100 caracteres")
        String name,

        @Size(max = 2000, message = "Descrição não pode exceder 2000 caracteres")
        String description
) {}
