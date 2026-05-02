package com.catalog.catalogitens.photo;

import com.catalog.catalogitens.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/photos")
@RequiredArgsConstructor
public class PhotoController {

    private static final String FALLBACK_CONTENT_TYPE = "application/octet-stream";

    private final PhotoService photoService;
    private final PhotoRepository photoRepository;
    private final StorageService storageService;

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID id) {
        photoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<InputStreamResource> streamFile(@PathVariable UUID id) {
        Photo photo = photoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Photo", id));
        StoredObject obj = storageService.load(photo.getObjectKey());
        return buildResponse(obj, photo.getContentType());
    }

    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<InputStreamResource> streamThumbnail(@PathVariable UUID id) {
        Photo photo = photoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Photo", id));
        String thumbKey = photo.getObjectKey().replace("photos/", "thumbs/");
        StoredObject obj;
        try {
            obj = storageService.load(thumbKey);
        } catch (ResourceNotFoundException e) {
            log.debug("Thumbnail missing for photo {}, falling back to original", id);
            obj = storageService.load(photo.getObjectKey());
        }
        return buildResponse(obj, photo.getContentType());
    }

    private ResponseEntity<InputStreamResource> buildResponse(StoredObject obj, String fallbackContentType) {
        String contentType = obj.contentType() != null ? obj.contentType()
                : (fallbackContentType != null ? fallbackContentType : FALLBACK_CONTENT_TYPE);

        ResponseEntity.BodyBuilder builder = ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePrivate());

        if (obj.contentLength() >= 0) {
            builder.contentLength(obj.contentLength());
        }
        if (obj.etag() != null && !obj.etag().isBlank()) {
            builder.header(HttpHeaders.ETAG, obj.etag());
        }

        return builder.body(new InputStreamResource(obj.stream()));
    }
}
