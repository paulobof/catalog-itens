package com.catalog.catalogitens.tag;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TagRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 50, message = "Name must not exceed 50 characters")
        String name,

        @Pattern(regexp = "^#[0-9a-fA-F]{6}$",
                 message = "Color must be a valid hex color code (e.g. #ff69b4)")
        String color
) {}
