package com.catalog.catalogitens.location;

import com.catalog.catalogitens.exception.ResourceNotFoundException;
import com.catalog.catalogitens.photo.Photo;
import com.catalog.catalogitens.photo.PhotoRepository;
import com.catalog.catalogitens.photo.StorageService;
import com.catalog.catalogitens.product.ProductLocationRepository;
import com.catalog.catalogitens.room.Room;
import com.catalog.catalogitens.room.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final RoomRepository roomRepository;
    private final ProductLocationRepository productLocationRepository;
    private final PhotoRepository photoRepository;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public List<LocationSummaryResponse> findAll(UUID roomId) {
        List<Location> locations = roomId != null
                ? locationRepository.findAllByRoomId(roomId)
                : locationRepository.findAllActive();

        return locations.stream()
                .map(loc -> {
                    long count = locationRepository.countActiveProductsByLocationId(loc.getId());
                    String thumbnailUrl = generateFirstThumbnailUrl("location", loc.getId());
                    return LocationSummaryResponse.from(loc, count, thumbnailUrl);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public LocationDetailResponse findById(UUID id) {
        Location location = locationRepository.findWithProductsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", id));

        long productCount = locationRepository.countActiveProductsByLocationId(id);

        List<LocationDetailResponse.LocationProductEntry> products = location.getProductLocations().stream()
                .map(pl -> new LocationDetailResponse.LocationProductEntry(
                        pl.getProduct().getId(),
                        pl.getProduct().getName(),
                        pl.getQuantity()
                ))
                .toList();

        return new LocationDetailResponse(
                location.getId(),
                location.getRoom().getId(),
                location.getRoom().getName(),
                location.getName(),
                location.getDescription(),
                products,
                productCount,
                location.getCreatedAt(),
                location.getUpdatedAt()
        );
    }

    @Transactional
    public LocationSummaryResponse create(LocationRequest request) {
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room", request.roomId()));

        Location location = new Location();
        location.setRoom(room);
        location.setName(request.name());
        location.setDescription(request.description());
        location = locationRepository.save(location);
        log.info("Created location: {} ({}) in room: {}", location.getName(), location.getId(), room.getId());
        return LocationSummaryResponse.from(location, 0, null);
    }

    @Transactional
    public LocationSummaryResponse update(UUID id, UpdateLocationRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", id));
        location.setName(request.name());
        location.setDescription(request.description());
        location = locationRepository.save(location);
        log.info("Updated location: {} ({})", location.getName(), location.getId());
        long count = locationRepository.countActiveProductsByLocationId(id);
        String thumbnailUrl = generateFirstThumbnailUrl("location", id);
        return LocationSummaryResponse.from(location, count, thumbnailUrl);
    }

    @Transactional
    public void delete(UUID id) {
        locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", id));

        // Cascade soft-delete ProductLocations before soft-deleting Location
        productLocationRepository.softDeleteByLocationId(id);
        locationRepository.deleteById(id);  // triggers @SQLDelete
        log.warn("Soft-deleted location: {}", id);
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
