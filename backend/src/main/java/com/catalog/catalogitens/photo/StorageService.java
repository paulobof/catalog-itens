package com.catalog.catalogitens.photo;

import java.io.InputStream;

public interface StorageService {

    /**
     * Uploads an object to storage.
     *
     * @param objectKey the key/path in the storage bucket
     * @param inputStream the content to upload
     * @param contentType the MIME type of the content
     * @param size the size in bytes
     */
    void upload(String objectKey, InputStream inputStream, String contentType, long size);

    /**
     * Generates a presigned URL for reading an object.
     *
     * @param objectKey the key/path in the storage bucket
     * @return a presigned URL valid for the configured TTL
     */
    String generatePresignedUrl(String objectKey);

    /**
     * Deletes an object from storage.
     *
     * @param objectKey the key/path in the storage bucket
     */
    void delete(String objectKey);

    /**
     * Checks whether the storage bucket is accessible.
     */
    boolean isHealthy();
}
