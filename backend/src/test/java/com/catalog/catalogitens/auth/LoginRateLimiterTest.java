package com.catalog.catalogitens.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRateLimiterTest {

    private LoginRateLimiter limiter;

    @BeforeEach
    void setUp() {
        limiter = new LoginRateLimiter();
    }

    @Test
    @DisplayName("checkLockout for an unknown key returns 0")
    void checkLockout_newKey_returnsZero() {
        assertThat(limiter.checkLockout("ip:1.2.3.4")).isZero();
    }

    @Test
    @DisplayName("recordFailure below the maximum does not lock the key")
    void recordFailure_lessThanMax_doesNotLock() {
        String key = "ip:1.2.3.4";
        for (int i = 0; i < 4; i++) {
            limiter.recordFailure(key);
        }

        assertThat(limiter.checkLockout(key))
                .as("4 failures must not trigger a lockout")
                .isZero();
    }

    @Test
    @DisplayName("recordFailure at the maximum locks the key")
    void recordFailure_atMax_locks() {
        String key = "ip:1.2.3.4";
        for (int i = 0; i < 5; i++) {
            limiter.recordFailure(key);
        }

        assertThat(limiter.checkLockout(key))
                .as("5 failures must trigger a lockout")
                .isPositive();
    }

    @Test
    @DisplayName("recordSuccess clears prior failures")
    void recordSuccess_clearsAttempts() {
        String key = "ip:1.2.3.4";
        for (int i = 0; i < 4; i++) {
            limiter.recordFailure(key);
        }

        limiter.recordSuccess(key);
        limiter.recordFailure(key);

        assertThat(limiter.checkLockout(key))
                .as("after recordSuccess the failure window must reset")
                .isZero();
    }

    @Test
    @DisplayName("failures are tracked independently per key")
    void differentKeys_independent() {
        String keyA = "ip:A";
        String keyB = "ip:B";

        for (int i = 0; i < 5; i++) {
            limiter.recordFailure(keyA);
        }

        assertThat(limiter.checkLockout(keyA))
                .as("keyA should be locked")
                .isPositive();
        assertThat(limiter.checkLockout(keyB))
                .as("keyB should not be affected by keyA failures")
                .isZero();
    }

    @Test
    @DisplayName("checkLockout with null or blank key returns 0")
    void checkLockout_nullOrBlank_returnsZero() {
        assertThat(limiter.checkLockout(null)).isZero();
        assertThat(limiter.checkLockout("")).isZero();
        assertThat(limiter.checkLockout("   ")).isZero();
    }

    @Test
    @DisplayName("recordFailure with null or blank key is a no-op")
    void recordFailure_nullOrBlank_isNoOp() {
        limiter.recordFailure(null);
        limiter.recordFailure("");
        limiter.recordFailure("  ");

        assertThat(limiter.checkLockout("anything")).isZero();
    }
}
