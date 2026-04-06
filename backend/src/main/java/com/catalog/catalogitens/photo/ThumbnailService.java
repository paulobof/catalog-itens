package com.catalog.catalogitens.photo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class ThumbnailService {

    private static final int THUMBNAIL_SIZE = 300;
    private static final String OUTPUT_FORMAT = "jpeg";
    private static final String CONTENT_TYPE = "image/jpeg";

    private final PhotoRepository photoRepository;
    private final StorageService storageService;

    public String generateFirstThumbnailUrl(String entityType, UUID entityId) {
        List<Photo> photos = photoRepository.findActiveByEntityTypeAndEntityId(entityType, entityId);
        if (photos.isEmpty()) {
            return null;
        }
        return generateThumbnailUrl(photos.getFirst().getObjectKey());
    }

    public String generateThumbnailUrl(String objectKey) {
        try {
            String thumbKey = objectKey.replace("photos/", "thumbs/");
            return storageService.generatePresignedUrl(thumbKey);
        } catch (Exception e) {
            return storageService.generatePresignedUrl(objectKey);
        }
    }

    public Map<UUID, String> generateFirstThumbnailUrls(String entityType, List<UUID> entityIds) {
        if (entityIds.isEmpty()) return Map.of();
        List<Photo> photos = photoRepository.findActiveByEntityTypeAndEntityIds(entityType, entityIds);
        Map<UUID, String> result = new HashMap<>();
        for (Photo photo : photos) {
            result.computeIfAbsent(photo.getEntityId(), id -> generateThumbnailUrl(photo.getObjectKey()));
        }
        return result;
    }

    @Async("photoExecutor")
    public CompletableFuture<Void> uploadThumbnailAsync(byte[] imageBytes, String thumbKey) {
        try {
            byte[] thumbBytes = generateThumbnail(imageBytes);
            storageService.upload(thumbKey, new ByteArrayInputStream(thumbBytes), CONTENT_TYPE, thumbBytes.length);
        } catch (Exception e) {
            log.error("Failed to generate/upload thumbnail for key {}: {}", thumbKey, e.getMessage(), e);
        }
        return CompletableFuture.completedFuture(null);
    }

    private byte[] generateThumbnail(byte[] imageBytes) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Thumbnails.of(new ByteArrayInputStream(imageBytes))
                .size(THUMBNAIL_SIZE, THUMBNAIL_SIZE)
                .keepAspectRatio(true)
                .outputFormat(OUTPUT_FORMAT)
                .outputQuality(0.75)
                .toOutputStream(out);
        return out.toByteArray();
    }
}
