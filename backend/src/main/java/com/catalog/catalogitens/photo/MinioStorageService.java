package com.catalog.catalogitens.photo;

import com.catalog.catalogitens.config.MinioProperties;
import com.catalog.catalogitens.exception.StorageException;
import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioStorageService implements StorageService {

    private final MinioClient minioClient;
    private final MinioProperties minioProperties;

    @Override
    public void upload(String objectKey, InputStream inputStream, String contentType, long size) {
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(minioProperties.bucket())
                            .object(objectKey)
                            .stream(inputStream, size, -1)
                            .contentType(contentType)
                            .build()
            );
            log.info("Uploaded object: {}", objectKey);
        } catch (Exception e) {
            log.error("Failed to upload object {}: {}", objectKey, e.getMessage(), e);
            throw new StorageException("Failed to upload file to storage", e);
        }
    }

    @Override
    public String generatePresignedUrl(String objectKey) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(minioProperties.bucket())
                            .object(objectKey)
                            .expiry(minioProperties.presignedUrlTtl(), TimeUnit.MINUTES)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to generate presigned URL for {}: {}", objectKey, e.getMessage(), e);
            throw new StorageException("Failed to generate presigned URL", e);
        }
    }

    @Override
    public void delete(String objectKey) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(minioProperties.bucket())
                            .object(objectKey)
                            .build()
            );
            log.info("Deleted object: {}", objectKey);
        } catch (Exception e) {
            log.error("Failed to delete object {}: {}", objectKey, e.getMessage(), e);
            throw new StorageException("Failed to delete file from storage", e);
        }
    }

    @Override
    public boolean isHealthy() {
        try {
            return minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(minioProperties.bucket())
                            .build()
            );
        } catch (Exception e) {
            log.warn("MinIO health check failed: {}", e.getMessage());
            return false;
        }
    }
}
