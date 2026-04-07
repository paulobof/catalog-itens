package com.catalog.catalogitens.location;

import com.catalog.catalogitens.exception.ResourceNotFoundException;
import com.catalog.catalogitens.photo.PhotoRepository;
import com.catalog.catalogitens.photo.PhotoResponse;
import com.catalog.catalogitens.photo.PhotoService;
import com.catalog.catalogitens.photo.ThumbnailService;
import com.catalog.catalogitens.product.ProductLocationRepository;
import com.catalog.catalogitens.room.Room;
import com.catalog.catalogitens.room.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final RoomRepository roomRepository;
    private final ProductLocationRepository productLocationRepository;
    private final PhotoRepository photoRepository;
    private final PhotoService photoService;
    private final ThumbnailService thumbnailService;

    @Transactional(readOnly = true)
    public List<LocationSummaryResponse> findAll(UUID roomId) {
        List<Location> locations = roomId != null
                ? locationRepository.findAllByRoomId(roomId)
                : locationRepository.findAllActive();

        List<UUID> locationIds = locations.stream().map(Location::getId).toList();
        Map<UUID, String> thumbnails = thumbnailService.generateFirstThumbnailUrls("location", locationIds);

        return locations.stream()
                .map(loc -> {
                    long count = locationRepository.countActiveProductsByLocationId(loc.getId());
                    String thumbnailUrl = thumbnails.get(loc.getId());
                    return LocationSummaryResponse.from(loc, count, thumbnailUrl);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public LocationDetailResponse findById(UUID id) {
        Location location = locationRepository.findWithProductsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", id));

        long productCount = locationRepository.countActiveProductsByLocationId(id);

        List<UUID> productIds = location.getProductLocations().stream()
                .map(pl -> pl.getProduct().getId())
                .toList();
        Map<UUID, String> productThumbnails = thumbnailService.generateFirstThumbnailUrls("product", productIds);

        List<LocationDetailResponse.LocationProductEntry> products = location.getProductLocations().stream()
                .map(pl -> new LocationDetailResponse.LocationProductEntry(
                        pl.getProduct().getId(),
                        pl.getProduct().getName(),
                        productThumbnails.get(pl.getProduct().getId()),
                        pl.getQuantity()
                ))
                .toList();

        List<PhotoResponse> photos = photoService.findByEntity("location", id);

        return new LocationDetailResponse(
                location.getId(),
                location.getRoom().getId(),
                location.getRoom().getName(),
                location.getName(),
                location.getDescription(),
                products,
                photos,
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
        String thumbnailUrl = thumbnailService.generateFirstThumbnailUrl("location", id);
        return LocationSummaryResponse.from(location, count, thumbnailUrl);
    }

    @Transactional
    public void delete(UUID id) {
        locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", id));

        productLocationRepository.softDeleteByLocationId(id);

        photoRepository.softDeleteAllByEntityTypeAndEntityId("location", id);

        locationRepository.deleteById(id);
        log.warn("Soft-deleted location: {}", id);
    }
}
