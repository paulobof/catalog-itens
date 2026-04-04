package com.catalog.catalogitens.room;

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
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Validated
public class RoomController {

    private final RoomService roomService;
    private final PhotoService photoService;

    @GetMapping
    public ResponseEntity<List<RoomSummaryResponse>> listRooms() {
        return ResponseEntity.ok(roomService.findAll());
    }

    @PostMapping
    public ResponseEntity<RoomSummaryResponse> createRoom(@Valid @RequestBody RoomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roomService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomDetailResponse> getRoom(@PathVariable UUID id) {
        return ResponseEntity.ok(roomService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoomSummaryResponse> updateRoom(@PathVariable UUID id,
                                                           @Valid @RequestBody RoomRequest request) {
        return ResponseEntity.ok(roomService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable UUID id) {
        roomService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PhotoResponse> uploadPhoto(@PathVariable UUID id,
                                                      @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(photoService.upload("room", id, file));
    }

    @PutMapping("/{id}/photos/reorder")
    public ResponseEntity<List<PhotoResponse>> reorderPhotos(@PathVariable UUID id,
                                                              @Valid @RequestBody PhotoReorderRequest request) {
        return ResponseEntity.ok(photoService.reorder("room", id, request));
    }
}
