package com.catalog.catalogitens.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage.minio")
public record MinioProperties(
        String endpoint,
        String accessKey,
        String secretKey,
        String bucket,
        int presignedUrlTtl
) {
    public MinioProperties {
        if (presignedUrlTtl <= 0) {
            presignedUrlTtl = 60;
        }
    }
}
