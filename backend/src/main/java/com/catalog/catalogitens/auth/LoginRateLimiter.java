package com.catalog.catalogitens.auth;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MILLIS = 15 * 60 * 1000L;
    private static final long LOCKOUT_MILLIS = 15 * 60 * 1000L;

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    public long checkLockout(String key) {
        if (key == null || key.isBlank()) return 0;
        Attempt a = attempts.get(key);
        if (a == null) return 0;
        long now = Instant.now().toEpochMilli();
        if (a.lockedUntil > now) {
            return (a.lockedUntil - now) / 1000;
        }
        if (a.windowStart + WINDOW_MILLIS < now) {
            attempts.remove(key);
        }
        return 0;
    }

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

    public void recordSuccess(String key) {
        if (key != null && !key.isBlank()) {
            attempts.remove(key);
        }
    }

    private record Attempt(int count, long windowStart, long lockedUntil) {}
}
