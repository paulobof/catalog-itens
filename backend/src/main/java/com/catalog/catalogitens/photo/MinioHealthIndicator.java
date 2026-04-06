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
        try {
            if (storageService.isHealthy()) {
                return Health.up().build();
            }
            return Health.down().withDetail("minio", "bucket not accessible").build();
        } catch (Exception e) {
            return Health.down().withDetail("minio", e.getMessage()).build();
        }
    }
}
