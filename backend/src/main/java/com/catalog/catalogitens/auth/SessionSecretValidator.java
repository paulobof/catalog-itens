package com.catalog.catalogitens.auth;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Slf4j
@Component
@Profile("prod")
public class SessionSecretValidator {

    private static final int MIN_SECRET_LENGTH = 32;

    private final String secret;

    public SessionSecretValidator(@Value("${app.auth.session-secret:}") String secret) {
        this.secret = secret;
    }

    @PostConstruct
    void validate() {
        if (secret == null || secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                    "SESSION_SECRET está ausente ou com menos de "
                            + MIN_SECRET_LENGTH
                            + " caracteres. O profile 'prod' não pode subir sem uma secret válida. "
                            + "Gere uma com: openssl rand -base64 48");
        }
        log.info("SESSION_SECRET validado (tamanho: {} chars)", secret.length());
    }
}
