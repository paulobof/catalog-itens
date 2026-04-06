package com.catalog.catalogitens.tag;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TagRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 50, message = "Nome não pode exceder 50 caracteres")
        String name,

        @Pattern(regexp = "^#[0-9a-fA-F]{6}$",
                 message = "Cor deve ser um código hexadecimal válido (ex: #ff69b4)")
        String color
) {}
