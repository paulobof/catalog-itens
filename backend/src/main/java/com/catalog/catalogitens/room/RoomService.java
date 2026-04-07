package com.catalog.catalogitens.room;

import com.catalog.catalogitens.exception.ResourceNotFoundException;
import com.catalog.catalogitens.location.Location;
import com.catalog.catalogitens.location.LocationRepository;
import com.catalog.catalogitens.location.LocationSummaryResponse;
import com.catalog.catalogitens.photo.PhotoEntityType;
import com.catalog.catalogitens.photo.PhotoRepository;
import com.catalog.catalogitens.photo.PhotoResponse;
import com.catalog.catalogitens.photo.PhotoService;
import com.catalog.catalogitens.photo.ThumbnailService;
import com.catalog.catalogitens.product.ProductLocationRepository;
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
public class RoomService {

    private final RoomRepository roomRepository;
    private final LocationRepository locationRepository;
    private final ProductLocationRepository productLocationRepository;
    private final PhotoRepository photoRepository;
    private final PhotoService photoService;
    private final ThumbnailService thumbnailService;

    @Transactional(readOnly = true)
    public List<RoomSummaryResponse> findAll() {
        List<Room> rooms = roomRepository.findAllActive();
        List<UUID> roomIds = rooms.stream().map(Room::getId).toList();
        Map<UUID, String> thumbnails = thumbnailService.generateFirstThumbnailUrls(
                PhotoEntityType.ROOM.dbValue(), roomIds);

        return rooms.stream()
                .map(room -> {
                    long locCount = roomRepository.countActiveLocationsByRoomId(room.getId());
                    long prodCount = roomRepository.countActiveProductsByRoomId(room.getId());
                    String thumbnailUrl = thumbnails.get(room.getId());
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
                    String locThumb = thumbnailService.generateFirstThumbnailUrl(
                            PhotoEntityType.LOCATION.dbValue(), loc.getId());
                    return LocationSummaryResponse.from(loc, pCount, locThumb);
                })
                .toList();

        List<PhotoResponse> photos = photoService.findByEntity(PhotoEntityType.ROOM.dbValue(), id);

        return new RoomDetailResponse(
                room.getId(),
                room.getName(),
                room.getDescription(),
                locationResponses,
                photos,
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
        String thumbnailUrl = thumbnailService.generateFirstThumbnailUrl(PhotoEntityType.ROOM.dbValue(), id);
        return RoomSummaryResponse.from(room, locCount, prodCount, thumbnailUrl);
    }

    @Transactional
    public void delete(UUID id) {
        roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", id));

        productLocationRepository.softDeleteByRoomId(id);

        List<Location> locations = locationRepository.findAllByRoomId(id);
        for (Location loc : locations) {
            photoRepository.softDeleteAllByEntityTypeAndEntityId(
                    PhotoEntityType.LOCATION.dbValue(), loc.getId());
        }

        locationRepository.softDeleteByRoomId(id);

        photoRepository.softDeleteAllByEntityTypeAndEntityId(PhotoEntityType.ROOM.dbValue(), id);

        roomRepository.deleteById(id);
        log.warn("Soft-deleted room: {}", id);
    }
}
