package com.catalog.catalogitens.room;

import com.catalog.catalogitens.exception.ResourceNotFoundException;
import com.catalog.catalogitens.location.LocationRepository;
import com.catalog.catalogitens.location.LocationSummaryResponse;
import com.catalog.catalogitens.photo.Photo;
import com.catalog.catalogitens.photo.PhotoRepository;
import com.catalog.catalogitens.photo.StorageService;
import com.catalog.catalogitens.product.ProductLocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final LocationRepository locationRepository;
    private final ProductLocationRepository productLocationRepository;
    private final PhotoRepository photoRepository;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public List<RoomSummaryResponse> findAll() {
        return roomRepository.findAllActive().stream()
                .map(room -> {
                    long locCount = roomRepository.countActiveLocationsByRoomId(room.getId());
                    long prodCount = roomRepository.countActiveProductsByRoomId(room.getId());
                    String thumbnailUrl = generateFirstThumbnailUrl("room", room.getId());
                    return RoomSummaryResponse.from(room, locCount, prodCount, thumbnailUrl);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomDetailResponse findById(UUID id) {
        Room room = roomRepository.findWithLocationsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", id));

        long locCount = roomRepository.countActiveLocationsByRoomId(id);
        long prodCount = roomRepository.countActiveProductsByRoomId(id);

        List<LocationSummaryResponse> locationResponses = room.getLocations().stream()
                .map(loc -> {
                    long pCount = locationRepository.countActiveProductsByLocationId(loc.getId());
                    String locThumb = generateFirstThumbnailUrl("location", loc.getId());
                    return LocationSummaryResponse.from(loc, pCount, locThumb);
                })
                .toList();

        return new RoomDetailResponse(
                room.getId(),
                room.getName(),
                room.getDescription(),
                locationResponses,
                locCount,
                prodCount,
                room.getCreatedAt(),
                room.getUpdatedAt()
        );
    }

    @Transactional
    public RoomSummaryResponse create(RoomRequest request) {
        Room room = new Room();
        room.setName(request.name());
        room.setDescription(request.description());
        room = roomRepository.save(room);
        log.info("Created room: {} ({})", room.getName(), room.getId());
        return RoomSummaryResponse.from(room, 0, 0, null);
    }

    @Transactional
    public RoomSummaryResponse update(UUID id, RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", id));
        room.setName(request.name());
        room.setDescription(request.description());
        room = roomRepository.save(room);
        log.info("Updated room: {} ({})", room.getName(), room.getId());
        long locCount = roomRepository.countActiveLocationsByRoomId(id);
        long prodCount = roomRepository.countActiveProductsByRoomId(id);
        String thumbnailUrl = generateFirstThumbnailUrl("room", id);
        return RoomSummaryResponse.from(room, locCount, prodCount, thumbnailUrl);
    }

    @Transactional
    public void delete(UUID id) {
        roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", id));

        // Cascade soft-delete: ProductLocations → Locations → Room
        productLocationRepository.softDeleteByRoomId(id);
        locationRepository.softDeleteByRoomId(id);
        roomRepository.deleteById(id);  // triggers @SQLDelete
        log.warn("Soft-deleted room: {}", id);
    }

    private String generateFirstThumbnailUrl(String entityType, UUID entityId) {
        List<Photo> photos = photoRepository.findActiveByEntityTypeAndEntityId(entityType, entityId);
        if (photos.isEmpty()) {
            return null;
        }
        return generateThumbnailUrl(photos.getFirst().getObjectKey());
    }

    private String generateThumbnailUrl(String objectKey) {
        try {
            String thumbKey = objectKey.replace("photos/", "thumbs/");
            return storageService.generatePresignedUrl(thumbKey);
        } catch (Exception e) {
            return storageService.generatePresignedUrl(objectKey);
        }
    }
}
