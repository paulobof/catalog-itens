package com.catalog.catalogitens.location;

import com.catalog.catalogitens.exception.ResourceNotFoundException;
import com.catalog.catalogitens.photo.PhotoRepository;
import com.catalog.catalogitens.photo.PhotoService;
import com.catalog.catalogitens.photo.ThumbnailService;
import com.catalog.catalogitens.product.ProductLocationRepository;
import com.catalog.catalogitens.room.Room;
import com.catalog.catalogitens.room.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocationServiceTest {

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private ProductLocationRepository productLocationRepository;

    @Mock
    private PhotoRepository photoRepository;

    @Mock
    private PhotoService photoService;

    @Mock
    private ThumbnailService thumbnailService;

    @InjectMocks
    private LocationService locationService;

    private UUID locationId;
    private UUID originalRoomId;
    private UUID newRoomId;
    private Room originalRoom;
    private Room newRoom;
    private Location location;

    @BeforeEach
    void setUp() {
        locationId = UUID.randomUUID();
        originalRoomId = UUID.randomUUID();
        newRoomId = UUID.randomUUID();

        originalRoom = new Room();
        originalRoom.setId(originalRoomId);
        originalRoom.setName("Cozinha");

        newRoom = new Room();
        newRoom.setId(newRoomId);
        newRoom.setName("Sala");

        location = new Location();
        location.setId(locationId);
        location.setRoom(originalRoom);
        location.setName("Armário superior");
        location.setDescription("Prateleira de cima");
    }

    @Test
    @DisplayName("update with same roomId keeps the original room and does not query rooms")
    void updateWithSameRoomKeepsRoom() {
        when(locationRepository.findById(locationId)).thenReturn(Optional.of(location));
        when(locationRepository.save(any(Location.class))).thenAnswer(inv -> inv.getArgument(0));
        when(locationRepository.countActiveProductsByLocationId(locationId)).thenReturn(0L);
        when(thumbnailService.generateFirstThumbnailUrl(anyString(), any(UUID.class))).thenReturn(null);

        UpdateLocationRequest request = new UpdateLocationRequest(
                originalRoomId, "Armário superior atualizado", "Nova descrição");

        locationService.update(locationId, request);

        assertThat(location.getRoom().getId()).isEqualTo(originalRoomId);
        assertThat(location.getName()).isEqualTo("Armário superior atualizado");
        assertThat(location.getDescription()).isEqualTo("Nova descrição");
        verify(roomRepository, never()).findById(any(UUID.class));
    }

    @Test
    @DisplayName("update with new roomId re-parents the location into the target room")
    void updateWithNewRoomReparents() {
        when(locationRepository.findById(locationId)).thenReturn(Optional.of(location));
        when(roomRepository.findById(newRoomId)).thenReturn(Optional.of(newRoom));
        when(locationRepository.save(any(Location.class))).thenAnswer(inv -> inv.getArgument(0));
        when(locationRepository.countActiveProductsByLocationId(locationId)).thenReturn(0L);
        when(thumbnailService.generateFirstThumbnailUrl(anyString(), any(UUID.class))).thenReturn(null);

        UpdateLocationRequest request = new UpdateLocationRequest(
                newRoomId, location.getName(), location.getDescription());

        locationService.update(locationId, request);

        assertThat(location.getRoom().getId()).isEqualTo(newRoomId);
        verify(roomRepository).findById(newRoomId);
    }

    @Test
    @DisplayName("update with non-existent target room throws ResourceNotFoundException")
    void updateWithMissingRoomThrows() {
        when(locationRepository.findById(locationId)).thenReturn(Optional.of(location));
        when(roomRepository.findById(newRoomId)).thenReturn(Optional.empty());

        UpdateLocationRequest request = new UpdateLocationRequest(
                newRoomId, location.getName(), location.getDescription());

        assertThatThrownBy(() -> locationService.update(locationId, request))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThat(location.getRoom().getId()).isEqualTo(originalRoomId);
    }

    @Test
    @DisplayName("update with non-existent location throws ResourceNotFoundException")
    void updateMissingLocationThrows() {
        when(locationRepository.findById(locationId)).thenReturn(Optional.empty());

        UpdateLocationRequest request = new UpdateLocationRequest(
                originalRoomId, "Name", null);

        assertThatThrownBy(() -> locationService.update(locationId, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
