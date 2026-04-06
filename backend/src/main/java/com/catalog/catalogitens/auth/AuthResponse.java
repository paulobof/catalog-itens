package com.catalog.catalogitens.auth;

public record AuthResponse(
        String id,
        String email,
        String name
) {}
