package com.catalog.catalogitens.product;

import com.catalog.catalogitens.exception.ResourceNotFoundException;
import com.catalog.catalogitens.location.Location;
import com.catalog.catalogitens.location.LocationRepository;
import com.catalog.catalogitens.photo.PhotoRepository;
import com.catalog.catalogitens.photo.StorageService;
import com.catalog.catalogitens.photo.ThumbnailService;
import com.catalog.catalogitens.tag.TagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceSyncLocationsTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductLocationRepository productLocationRepository;

    @Mock
    private ProductTagRepository productTagRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private PhotoRepository photoRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private ThumbnailService thumbnailService;

    @InjectMocks
    private ProductService productService;

    private Product product;
    private UUID productId;
    private UUID locationAId;
    private UUID locationBId;
    private UUID locationCId;
    private Location locationA;
    private Location locationB;
    private Location locationC;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        locationAId = UUID.randomUUID();
        locationBId = UUID.randomUUID();
        locationCId = UUID.randomUUID();

        product = new Product();
        product.setId(productId);
        product.setName("Furadeira");

        locationA = new Location();
        locationA.setId(locationAId);
        locationA.setName("Cozinha");

        locationB = new Location();
        locationB.setId(locationBId);
        locationB.setName("Porão");

        locationC = new Location();
        locationC.setId(locationCId);
        locationC.setName("Oficina");
    }

    private ProductLocation productLocationAt(Location location, int quantity) {
        ProductLocation pl = new ProductLocation();
        pl.setId(UUID.randomUUID());
        pl.setProduct(product);
        pl.setLocation(location);
        pl.setQuantity(quantity);
        return pl;
    }

    @Test
    @DisplayName("updating quantity on existing ProductLocation saves the change and does not insert or delete")
    void updatesQuantityInPlace() {
        ProductLocation existing = productLocationAt(locationA, 3);
        when(productLocationRepository.findActiveByProductId(productId))
                .thenReturn(new ArrayList<>(List.of(existing)));
        when(productLocationRepository.save(any(ProductLocation.class))).thenAnswer(inv -> inv.getArgument(0));

        productService.syncProductLocations(product, List.of(
                new UpdateProductRequest.ProductLocationEntry(locationAId, 5)));

        assertThat(existing.getQuantity()).isEqualTo(5);
        verify(productLocationRepository).save(existing);
        verify(productLocationRepository, never()).deleteById(any(UUID.class));
        verify(locationRepository, never()).findById(any(UUID.class));
    }

    @Test
    @DisplayName("unchanged quantity does not trigger a save call")
    void unchangedQuantityIsNoOp() {
        ProductLocation existing = productLocationAt(locationA, 3);
        when(productLocationRepository.findActiveByProductId(productId))
                .thenReturn(new ArrayList<>(List.of(existing)));

        productService.syncProductLocations(product, List.of(
                new UpdateProductRequest.ProductLocationEntry(locationAId, 3)));

        verify(productLocationRepository, never()).save(any(ProductLocation.class));
        verify(productLocationRepository, never()).deleteById(any(UUID.class));
    }

    @Test
    @DisplayName("new location in desired list is inserted as a new ProductLocation")
    void insertsNewLocation() {
        when(productLocationRepository.findActiveByProductId(productId))
                .thenReturn(new ArrayList<>());
        when(locationRepository.findById(locationBId)).thenReturn(Optional.of(locationB));
        when(productLocationRepository.save(any(ProductLocation.class))).thenAnswer(inv -> inv.getArgument(0));

        productService.syncProductLocations(product, List.of(
                new UpdateProductRequest.ProductLocationEntry(locationBId, 2)));

        ArgumentCaptor<ProductLocation> captor = ArgumentCaptor.forClass(ProductLocation.class);
        verify(productLocationRepository).save(captor.capture());
        ProductLocation saved = captor.getValue();
        assertThat(saved.getLocation()).isSameAs(locationB);
        assertThat(saved.getQuantity()).isEqualTo(2);
        verify(productLocationRepository, never()).deleteById(any(UUID.class));
    }

    @Test
    @DisplayName("missing location in desired list is soft-deleted via deleteById")
    void removesMissingLocation() {
        ProductLocation staying = productLocationAt(locationA, 1);
        ProductLocation leaving = productLocationAt(locationB, 4);
        when(productLocationRepository.findActiveByProductId(productId))
                .thenReturn(new ArrayList<>(List.of(staying, leaving)));

        productService.syncProductLocations(product, List.of(
                new UpdateProductRequest.ProductLocationEntry(locationAId, 1)));

        verify(productLocationRepository).deleteById(leaving.getId());
        verify(productLocationRepository, never()).deleteById(staying.getId());
        verify(productLocationRepository, never()).save(any(ProductLocation.class));
    }

    @Test
    @DisplayName("split move: quantity reduced on source and new row added on destination")
    void splitMoveAcrossLocations() {
        ProductLocation source = productLocationAt(locationA, 3);
        when(productLocationRepository.findActiveByProductId(productId))
                .thenReturn(new ArrayList<>(List.of(source)));
        when(locationRepository.findById(locationBId)).thenReturn(Optional.of(locationB));
        when(productLocationRepository.save(any(ProductLocation.class))).thenAnswer(inv -> inv.getArgument(0));

        productService.syncProductLocations(product, List.of(
                new UpdateProductRequest.ProductLocationEntry(locationAId, 1),
                new UpdateProductRequest.ProductLocationEntry(locationBId, 2)));

        assertThat(source.getQuantity()).isEqualTo(1);
        verify(productLocationRepository, times(2)).save(any(ProductLocation.class));
        verify(productLocationRepository, never()).deleteById(any(UUID.class));
    }

    @Test
    @DisplayName("full move: source is removed and destination is inserted")
    void fullMoveAcrossLocations() {
        ProductLocation source = productLocationAt(locationA, 3);
        when(productLocationRepository.findActiveByProductId(productId))
                .thenReturn(new ArrayList<>(List.of(source)));
        when(locationRepository.findById(locationCId)).thenReturn(Optional.of(locationC));
        when(productLocationRepository.save(any(ProductLocation.class))).thenAnswer(inv -> inv.getArgument(0));

        productService.syncProductLocations(product, List.of(
                new UpdateProductRequest.ProductLocationEntry(locationCId, 3)));

        verify(productLocationRepository).deleteById(source.getId());

        ArgumentCaptor<ProductLocation> captor = ArgumentCaptor.forClass(ProductLocation.class);
        verify(productLocationRepository).save(captor.capture());
        ProductLocation inserted = captor.getValue();
        assertThat(inserted.getLocation()).isSameAs(locationC);
        assertThat(inserted.getQuantity()).isEqualTo(3);
    }

    @Test
    @DisplayName("unknown location id in desired list throws ResourceNotFoundException")
    void unknownDestinationThrows() {
        when(productLocationRepository.findActiveByProductId(productId))
                .thenReturn(new ArrayList<>());
        when(locationRepository.findById(locationBId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.syncProductLocations(product, List.of(
                new UpdateProductRequest.ProductLocationEntry(locationBId, 1))))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
