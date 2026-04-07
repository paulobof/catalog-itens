package com.catalog.catalogitens.product;

import com.catalog.catalogitens.common.PageResponse;
import com.catalog.catalogitens.exception.ResourceNotFoundException;
import com.catalog.catalogitens.location.Location;
import com.catalog.catalogitens.location.LocationRepository;
import com.catalog.catalogitens.photo.Photo;
import com.catalog.catalogitens.photo.PhotoEntityType;
import com.catalog.catalogitens.photo.PhotoRepository;
import com.catalog.catalogitens.photo.StorageService;
import com.catalog.catalogitens.photo.ThumbnailService;
import com.catalog.catalogitens.tag.Tag;
import com.catalog.catalogitens.tag.TagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ProductRepository productRepository;
    private final ProductLocationRepository productLocationRepository;
    private final ProductTagRepository productTagRepository;
    private final LocationRepository locationRepository;
    private final TagRepository tagRepository;
    private final PhotoRepository photoRepository;
    private final StorageService storageService;
    private final ThumbnailService thumbnailService;

    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryResponse> search(String q, UUID roomId, UUID tagId,
                                                        int page, int size) {
        int cappedSize = Math.min(size, MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(page, cappedSize);
        String searchQuery = (q != null && !q.isBlank()) ? q.trim() : null;

        Page<Product> products = productRepository.searchProducts(searchQuery, roomId, tagId, pageable);

        Page<ProductSummaryResponse> responses = products.map(product -> {
            List<Photo> photos = photoRepository.findActiveByEntityTypeAndEntityId(
                    PhotoEntityType.PRODUCT.dbValue(), product.getId());
            String thumbnailUrl = photos.isEmpty() ? null
                    : thumbnailService.generateThumbnailUrl(photos.getFirst().getObjectKey());

            List<ProductSummaryResponse.TagEntry> tags = product.getProductTags().stream()
                    .map(pt -> new ProductSummaryResponse.TagEntry(
                            pt.getTag().getId(), pt.getTag().getName(), pt.getTag().getColor()))
                    .toList();

            List<ProductSummaryResponse.LocationEntry> locations = product.getProductLocations().stream()
                    .map(pl -> new ProductSummaryResponse.LocationEntry(
                            pl.getLocation().getId(),
                            pl.getLocation().getName(),
                            pl.getLocation().getRoom().getId(),
                            pl.getLocation().getRoom().getName(),
                            pl.getQuantity()))
                    .toList();

            int totalQuantity = locations.stream().mapToInt(ProductSummaryResponse.LocationEntry::quantity).sum();

            return new ProductSummaryResponse(
                    product.getId(), product.getName(), product.getDescription(),
                    tags, locations, totalQuantity, thumbnailUrl,
                    product.getCreatedAt(), product.getUpdatedAt());
        });

        return PageResponse.from(responses);
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse findById(UUID id) {
        Product product = productRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        List<Photo> photos = photoRepository.findActiveByEntityTypeAndEntityId(
                PhotoEntityType.PRODUCT.dbValue(), id);

        List<ProductDetailResponse.TagEntry> tags = product.getProductTags().stream()
                .map(pt -> new ProductDetailResponse.TagEntry(
                        pt.getTag().getId(), pt.getTag().getName(), pt.getTag().getColor()))
                .toList();

        List<ProductDetailResponse.LocationEntry> locations = product.getProductLocations().stream()
                .map(pl -> new ProductDetailResponse.LocationEntry(
                        pl.getId(),
                        pl.getLocation().getId(),
                        pl.getLocation().getName(),
                        pl.getLocation().getRoom().getId(),
                        pl.getLocation().getRoom().getName(),
                        pl.getQuantity()))
                .toList();

        List<ProductDetailResponse.PhotoEntry> photoEntries = photos.stream()
                .map(ph -> new ProductDetailResponse.PhotoEntry(
                        ph.getId(),
                        storageService.generatePresignedUrl(ph.getObjectKey()),
                        thumbnailService.generateThumbnailUrl(ph.getObjectKey()),
                        ph.getOriginalFilename(),
                        ph.getFileSize(),
                        ph.getSortOrder()))
                .toList();

        int totalQuantity = locations.stream()
                .mapToInt(ProductDetailResponse.LocationEntry::quantity).sum();

        return new ProductDetailResponse(
                product.getId(), product.getName(), product.getDescription(),
                tags, locations, photoEntries, totalQuantity,
                product.getCreatedAt(), product.getUpdatedAt());
    }

    @Transactional
    public ProductDetailResponse create(CreateProductRequest request) {
        Product product = new Product();
        product.setName(request.name());
        product.setDescription(request.description());
        product = productRepository.save(product);

        if (request.tagIds() != null) {
            for (UUID tagId : request.tagIds()) {
                Tag tag = tagRepository.findById(tagId)
                        .orElseThrow(() -> new ResourceNotFoundException("Tag", tagId));
                ProductTag pt = new ProductTag();
                pt.setProduct(product);
                pt.setTag(tag);
                pt = productTagRepository.save(pt);
                product.getProductTags().add(pt);
            }
        }

        if (request.locations() != null) {
            for (CreateProductRequest.ProductLocationEntry entry : request.locations()) {
                Location location = locationRepository.findById(entry.locationId())
                        .orElseThrow(() -> new ResourceNotFoundException("Location", entry.locationId()));
                ProductLocation pl = new ProductLocation();
                pl.setProduct(product);
                pl.setLocation(location);
                pl.setQuantity(entry.quantity() > 0 ? entry.quantity() : 1);
                pl = productLocationRepository.save(pl);
                product.getProductLocations().add(pl);
            }
        }

        log.info("Created product: {} ({})", product.getName(), product.getId());
        return findById(product.getId());
    }

    @Transactional
    public ProductDetailResponse update(UUID id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        product.setName(request.name());
        product.setDescription(request.description());
        productRepository.save(product);

        if (request.tagIds() != null) {
            productTagRepository.deleteAllByProductId(id);
            for (UUID tagId : request.tagIds()) {
                Tag tag = tagRepository.findById(tagId)
                        .orElseThrow(() -> new ResourceNotFoundException("Tag", tagId));
                ProductTag pt = new ProductTag();
                pt.setProduct(product);
                pt.setTag(tag);
                productTagRepository.save(pt);
            }
        }

        log.info("Updated product: {} ({})", product.getName(), product.getId());
        return findById(id);
    }

    @Transactional
    public void delete(UUID id) {
        productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        productLocationRepository.softDeleteByProductId(id);
        productTagRepository.deleteAllByProductId(id);

        List<Photo> photos = photoRepository.findActiveByEntityTypeAndEntityId(
                PhotoEntityType.PRODUCT.dbValue(), id);
        for (Photo photo : photos) {
            try {
                storageService.delete(photo.getObjectKey());
                String thumbKey = photo.getObjectKey().replace("photos/", "thumbs/");
                storageService.delete(thumbKey);
            } catch (Exception e) {
                log.error("Failed to delete photo from storage: {}", photo.getObjectKey(), e);
            }
        }
        photoRepository.softDeleteAllByEntityTypeAndEntityId(PhotoEntityType.PRODUCT.dbValue(), id);

        productRepository.deleteById(id);
        log.warn("Soft-deleted product: {}", id);
    }

    @Transactional
    public ProductLocationResponse addLocation(UUID productId, ProductLocationRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
        Location location = locationRepository.findById(request.locationId())
                .orElseThrow(() -> new ResourceNotFoundException("Location", request.locationId()));

        productLocationRepository.findActiveByProductIdAndLocationId(productId, request.locationId())
                .ifPresent(existing -> {
                    throw new org.springframework.dao.DataIntegrityViolationException(
                            "Product is already associated with this location. Use PUT to update quantity.");
                });

        ProductLocation pl = new ProductLocation();
        pl.setProduct(product);
        pl.setLocation(location);
        pl.setQuantity(request.quantity() > 0 ? request.quantity() : 1);
        pl = productLocationRepository.save(pl);

        log.info("Added product {} to location {}", productId, request.locationId());
        return toProductLocationResponse(pl);
    }

    @Transactional
    public ProductLocationResponse updateLocation(UUID productId, UUID locationId,
                                                   UpdateProductLocationRequest request) {
        ProductLocation pl = productLocationRepository
                .findActiveByProductIdAndLocationId(productId, locationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ProductLocation for product " + productId + " and location " + locationId));

        pl.setQuantity(request.quantity());
        pl = productLocationRepository.save(pl);
        log.info("Updated quantity for product {} at location {}: {}", productId, locationId, request.quantity());
        return toProductLocationResponse(pl);
    }

    @Transactional
    public void removeLocation(UUID productId, UUID locationId) {
        ProductLocation pl = productLocationRepository
                .findActiveByProductIdAndLocationId(productId, locationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ProductLocation for product " + productId + " and location " + locationId));

        productLocationRepository.deleteById(pl.getId());
        log.warn("Removed product {} from location {}", productId, locationId);
    }

    private ProductLocationResponse toProductLocationResponse(ProductLocation pl) {
        return new ProductLocationResponse(
                pl.getId(),
                pl.getProduct().getId(),
                pl.getLocation().getId(),
                pl.getLocation().getName(),
                pl.getLocation().getRoom().getId(),
                pl.getLocation().getRoom().getName(),
                pl.getQuantity(),
                pl.getCreatedAt(),
                pl.getUpdatedAt()
        );
    }

}
