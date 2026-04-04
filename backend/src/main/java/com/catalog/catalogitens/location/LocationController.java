package com.catalog.catalogitens.location;

import com.catalog.catalogitens.photo.PhotoReorderRequest;
import com.catalog.catalogitens.photo.PhotoResponse;
import com.catalog.catalogitens.photo.PhotoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
@Validated
public class LocationController {

    private final LocationService locationService;
    private final PhotoService photoService;

    @GetMapping
    public ResponseEntity<List<LocationSummaryResponse>> listLocations(
            @RequestParam(required = false) UUID roomId) {
        return ResponseEntity.ok(locationService.findAll(roomId));
    }

    @PostMapping
    public ResponseEntity<LocationSummaryResponse> createLocation(
            @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(locationService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocationDetailResponse> getLocation(@PathVariable UUID id) {
        return ResponseEntity.ok(locationService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LocationSummaryResponse> updateLocation(@PathVariable UUID id,
                                                                   @Valid @RequestBody UpdateLocationRequest request) {
        return ResponseEntity.ok(locationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable UUID id) {
        locationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PhotoResponse> uploadPhoto(@PathVariable UUID id,
                                                      @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(photoService.upload("location", id, file));
    }

    @PutMapping("/{id}/photos/reorder")
    public ResponseEntity<List<PhotoResponse>> reorderPhotos(@PathVariable UUID id,
                                                              @Valid @RequestBody PhotoReorderRequest request) {
        return ResponseEntity.ok(photoService.reorder("location", id, request));
    }
}
