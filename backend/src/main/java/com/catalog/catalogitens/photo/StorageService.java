package com.catalog.catalogitens.photo;

import java.io.InputStream;

public interface StorageService {

    void upload(String objectKey, InputStream inputStream, String contentType, long size);

    String generatePresignedUrl(String objectKey);

    void delete(String objectKey);

    boolean isHealthy();
}
