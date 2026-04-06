package com.catalog.catalogitens.photo;

import com.catalog.catalogitens.exception.InvalidFileException;
import com.catalog.catalogitens.exception.PhotoLimitExceededException;
import com.catalog.catalogitens.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PhotoService {

    private static final int MAX_PHOTOS_PER_ENTITY = 3;
    private static final int MAX_DIMENSION = 2048;
    private static final String OUTPUT_FORMAT = "jpeg";
    private static final String CONTENT_TYPE = "image/jpeg";
    private static final String EXTENSION = "jpg";

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    // Magic bytes for JPEG, PNG and WebP
    private static final byte[] JPEG_MAGIC = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_MAGIC  = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
    private static final byte[] WEBP_MAGIC_RIFF = "RIFF".getBytes();
    private static final byte[] WEBP_MAGIC_WEBP = "WEBP".getBytes();

    private final PhotoRepository photoRepository;
    private final StorageService storageService;
    private final ThumbnailService thumbnailService;

    @Transactional(readOnly = true)
    public List<PhotoResponse> findByEntity(String entityType, UUID entityId) {
        return photoRepository.findActiveByEntityTypeAndEntityId(entityType, entityId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PhotoResponse upload(String entityType, UUID entityId, MultipartFile file) {
        validateEntityType(entityType);

        long currentCount = photoRepository.countActiveByEntityTypeAndEntityId(entityType, entityId);
        if (currentCount >= MAX_PHOTOS_PER_ENTITY) {
            throw new PhotoLimitExceededException(entityType, entityId);
        }

        validateFile(file);

        byte[] imageBytes = readAndReencode(file);
        String photoUuid = UUID.randomUUID().toString();
        String objectKey = "photos/" + entityType + "/" + entityId + "/" + photoUuid + "." + EXTENSION;
        String thumbKey  = "thumbs/" + entityType + "/" + entityId + "/" + photoUuid + "." + EXTENSION;

        // Upload original (re-encoded, EXIF stripped)
        storageService.upload(objectKey, new ByteArrayInputStream(imageBytes), CONTENT_TYPE, imageBytes.length);

        // Generate and upload thumbnail asynchronously
        thumbnailService.uploadThumbnailAsync(imageBytes, thumbKey);

        int sortOrder = (int) currentCount;
        Photo photo = new Photo();
        photo.setEntityType(entityType);
        photo.setEntityId(entityId);
        photo.setObjectKey(objectKey);
        photo.setOriginalFilename(sanitizeFilename(file.getOriginalFilename()));
        photo.setContentType(CONTENT_TYPE);
        photo.setFileSize(imageBytes.length);
        photo.setSortOrder(sortOrder);
        photo = photoRepository.save(photo);

        log.info("Uploaded photo {} for {}/{}", photo.getId(), entityType, entityId);
        return toResponse(photo);
    }

    @Transactional
    public List<PhotoResponse> reorder(String entityType, UUID entityId, PhotoReorderRequest request) {
        validateEntityType(entityType);

        for (PhotoReorderRequest.PhotoSortEntry entry : request.photos()) {
            Photo photo = photoRepository.findById(entry.photoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Photo", entry.photoId()));

            if (!photo.getEntityType().equals(entityType) || !photo.getEntityId().equals(entityId)) {
                throw new InvalidFileException("Photo " + entry.photoId() + " does not belong to " +
                        entityType + "/" + entityId);
            }

            photo.setSortOrder(entry.sortOrder());
            photoRepository.save(photo);
        }

        return findByEntity(entityType, entityId);
    }

    @Transactional
    public void delete(UUID photoId) {
        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Photo", photoId));

        String thumbKey = photo.getObjectKey().replace("photos/", "thumbs/");
        try {
            storageService.delete(photo.getObjectKey());
        } catch (Exception e) {
            log.error("Failed to delete photo from storage: {}", photo.getObjectKey(), e);
        }
        try {
            storageService.delete(thumbKey);
        } catch (Exception e) {
            log.warn("Failed to delete thumbnail from storage: {}", thumbKey, e);
        }

        photoRepository.deleteById(photoId);  // triggers @SQLDelete
        log.warn("Deleted photo: {}", photoId);
    }

    private void validateEntityType(String entityType) {
        if (!Set.of("product", "location", "room").contains(entityType)) {
            throw new InvalidFileException("Invalid entity type: " + entityType);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("File must not be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new InvalidFileException(
                    "File type not allowed. Only JPEG, PNG and WebP images are accepted.");
        }

        try {
            byte[] magicBytes = new byte[12];
            try (InputStream is = file.getInputStream()) {
                int read = is.read(magicBytes);
                if (read < 4) {
                    throw new InvalidFileException("File is too small to be a valid image");
                }
            }
            if (!isValidMagicBytes(magicBytes)) {
                throw new InvalidFileException("File content does not match a supported image format");
            }
        } catch (IOException e) {
            throw new InvalidFileException("Unable to read file content");
        }
    }

    private boolean isValidMagicBytes(byte[] bytes) {
        // JPEG: FF D8 FF
        if (bytes.length >= 3 &&
                bytes[0] == JPEG_MAGIC[0] && bytes[1] == JPEG_MAGIC[1] && bytes[2] == JPEG_MAGIC[2]) {
            return true;
        }
        // PNG: 89 50 4E 47
        if (bytes.length >= 4 &&
                bytes[0] == PNG_MAGIC[0] && bytes[1] == PNG_MAGIC[1] &&
                bytes[2] == PNG_MAGIC[2] && bytes[3] == PNG_MAGIC[3]) {
            return true;
        }
        // WebP: RIFF....WEBP
        if (bytes.length >= 12) {
            byte[] riff = Arrays.copyOfRange(bytes, 0, 4);
            byte[] webp = Arrays.copyOfRange(bytes, 8, 12);
            if (Arrays.equals(riff, WEBP_MAGIC_RIFF) && Arrays.equals(webp, WEBP_MAGIC_WEBP)) {
                return true;
            }
        }
        return false;
    }

    private byte[] readAndReencode(MultipartFile file) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Thumbnails.of(file.getInputStream())
                    .size(MAX_DIMENSION, MAX_DIMENSION)
                    .keepAspectRatio(true)
                    .outputFormat(OUTPUT_FORMAT)
                    .outputQuality(0.85)
                    .toOutputStream(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new InvalidFileException("Failed to process image: " + e.getMessage());
        }
    }

    private PhotoResponse toResponse(Photo photo) {
        String url = storageService.generatePresignedUrl(photo.getObjectKey());
        String thumbKey = photo.getObjectKey().replace("photos/", "thumbs/");
        String thumbnailUrl;
        try {
            thumbnailUrl = storageService.generatePresignedUrl(thumbKey);
        } catch (Exception e) {
            thumbnailUrl = url;
        }
        return new PhotoResponse(
                photo.getId(),
                photo.getEntityType(),
                photo.getEntityId(),
                url,
                thumbnailUrl,
                photo.getOriginalFilename(),
                photo.getContentType(),
                photo.getFileSize(),
                photo.getSortOrder(),
                photo.getCreatedAt()
        );
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "upload";
        }
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
