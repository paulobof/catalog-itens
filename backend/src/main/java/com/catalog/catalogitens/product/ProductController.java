package com.catalog.catalogitens.product;

import com.catalog.catalogitens.common.PageResponse;
import com.catalog.catalogitens.photo.PhotoReorderRequest;
import com.catalog.catalogitens.photo.PhotoResponse;
import com.catalog.catalogitens.photo.PhotoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
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
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Validated
public class ProductController {

    private final ProductService productService;
    private final PhotoService photoService;

    @GetMapping
    public ResponseEntity<PageResponse<ProductSummaryResponse>> listProducts(
            @RequestParam(required = false) @Size(max = 200) String q,
            @RequestParam(required = false) UUID roomId,
            @RequestParam(required = false) UUID tagId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size) {
        return ResponseEntity.ok(productService.search(q, roomId, tagId, page, size));
    }

    @PostMapping
    public ResponseEntity<ProductDetailResponse> createProduct(
            @Valid @RequestBody CreateProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailResponse> getProduct(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDetailResponse> updateProduct(@PathVariable UUID id,
                                                                @Valid @RequestBody UpdateProductRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Product-Location sub-resource

    @PostMapping("/{id}/locations")
    public ResponseEntity<ProductLocationResponse> addLocation(@PathVariable UUID id,
                                                                @Valid @RequestBody ProductLocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.addLocation(id, request));
    }

    @PutMapping("/{id}/locations/{locationId}")
    public ResponseEntity<ProductLocationResponse> updateLocation(@PathVariable UUID id,
                                                                   @PathVariable UUID locationId,
                                                                   @Valid @RequestBody UpdateProductLocationRequest request) {
        return ResponseEntity.ok(productService.updateLocation(id, locationId, request));
    }

    @DeleteMapping("/{id}/locations/{locationId}")
    public ResponseEntity<Void> removeLocation(@PathVariable UUID id,
                                                @PathVariable UUID locationId) {
        productService.removeLocation(id, locationId);
        return ResponseEntity.noContent().build();
    }

    // Photos sub-resource

    @PostMapping(value = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PhotoResponse> uploadPhoto(@PathVariable UUID id,
                                                      @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(photoService.upload("product", id, file));
    }

    @PutMapping("/{id}/photos/reorder")
    public ResponseEntity<List<PhotoResponse>> reorderPhotos(@PathVariable UUID id,
                                                              @Valid @RequestBody PhotoReorderRequest request) {
        return ResponseEntity.ok(photoService.reorder("product", id, request));
    }
}
