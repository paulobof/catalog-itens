package com.catalog.catalogitens.photo;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MinioHealthIndicator implements HealthIndicator {

    private final StorageService storageService;

    @Override
    public Health health() {
        if (storageService.isHealthy()) {
            return Health.up().build();
        }
        return Health.down().withDetail("reason", "MinIO bucket not accessible").build();
    }
}
