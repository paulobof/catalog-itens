package com.catalog.catalogitens.auth;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiter in-memory para o endpoint de login.
 * Limita tentativas por IP e por email — janela deslizante com lockout.
 */
@Slf4j
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MILLIS = 15 * 60 * 1000L; // 15 minutos
    private static final long LOCKOUT_MILLIS = 15 * 60 * 1000L; // 15 minutos

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    /**
     * Verifica se a chave (IP ou email) esta bloqueada. Se estiver, retorna
     * o numero de segundos restantes de lockout. Se nao, retorna 0.
     */
    public long checkLockout(String key) {
        if (key == null || key.isBlank()) return 0;
        Attempt a = attempts.get(key);
        if (a == null) return 0;
        long now = Instant.now().toEpochMilli();
        if (a.lockedUntil > now) {
            return (a.lockedUntil - now) / 1000;
        }
        // Janela expirou — limpa entrada
        if (a.windowStart + WINDOW_MILLIS < now) {
            attempts.remove(key);
        }
        return 0;
    }

    /**
     * Registra uma tentativa falha. Se exceder MAX_ATTEMPTS na janela,
     * aplica lockout.
     */
    public void recordFailure(String key) {
        if (key == null || key.isBlank()) return;
        long now = Instant.now().toEpochMilli();
        attempts.compute(key, (k, existing) -> {
            if (existing == null || existing.windowStart + WINDOW_MILLIS < now) {
                return new Attempt(1, now, 0);
            }
            int count = existing.count + 1;
            long lockedUntil = (count >= MAX_ATTEMPTS) ? now + LOCKOUT_MILLIS : 0;
            if (lockedUntil > 0) {
                log.warn("Rate limit: {} bloqueado por {} min apos {} tentativas",
                        k, LOCKOUT_MILLIS / 60000, count);
            }
            return new Attempt(count, existing.windowStart, lockedUntil);
        });
    }

    /**
     * Limpa as tentativas de uma chave (chamado apos login bem-sucedido).
     */
    public void recordSuccess(String key) {
        if (key != null && !key.isBlank()) {
            attempts.remove(key);
        }
    }

    private record Attempt(int count, long windowStart, long lockedUntil) {}
}
