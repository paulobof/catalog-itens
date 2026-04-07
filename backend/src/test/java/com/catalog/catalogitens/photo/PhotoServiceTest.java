package com.catalog.catalogitens.photo;

import com.catalog.catalogitens.exception.InvalidFileException;
import com.catalog.catalogitens.exception.PhotoLimitExceededException;
import com.catalog.catalogitens.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PhotoServiceTest {

    @Mock
    private PhotoRepository photoRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private ThumbnailService thumbnailService;

    private PhotoService photoService;

    @BeforeEach
    void setUp() {
        photoService = new PhotoService(photoRepository, storageService, thumbnailService);
    }

    private static byte[] validJpegBytes() throws IOException {
        BufferedImage img = new BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpeg", baos);
        return baos.toByteArray();
    }

    private static MockMultipartFile validJpegFile() throws IOException {
        return new MockMultipartFile("file", "test.jpg", "image/jpeg", validJpegBytes());
    }

    @Test
    @DisplayName("upload with a valid JPEG returns a PhotoResponse and persists everything")
    void upload_validJpeg_succeeds() throws IOException {
        UUID entityId = UUID.randomUUID();
        MockMultipartFile file = validJpegFile();

        when(photoRepository.countActiveByEntityTypeAndEntityId("product", entityId)).thenReturn(0L);
        when(photoRepository.save(any(Photo.class))).thenAnswer(invocation -> {
            Photo p = invocation.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });
        when(storageService.generatePresignedUrl(anyString())).thenReturn("https://example.com/photo");

        PhotoResponse response = photoService.upload("product", entityId, file);

        assertThat(response).isNotNull();
        assertThat(response.entityType()).isEqualTo("product");
        assertThat(response.entityId()).isEqualTo(entityId);
        assertThat(response.contentType()).isEqualTo("image/jpeg");
        assertThat(response.sortOrder()).isZero();

        verify(storageService, times(1))
                .upload(anyString(), any(InputStream.class), eq("image/jpeg"), anyLong());
        verify(thumbnailService, times(1)).uploadThumbnailAsync(any(byte[].class), anyString());
        verify(photoRepository, times(1)).save(any(Photo.class));
    }

    @Test
    @DisplayName("upload of a 4th photo throws PhotoLimitExceededException")
    void upload_4thPhoto_throwsLimitExceeded() throws IOException {
        UUID entityId = UUID.randomUUID();
        MockMultipartFile file = validJpegFile();

        when(photoRepository.countActiveByEntityTypeAndEntityId("product", entityId)).thenReturn(3L);

        assertThatThrownBy(() -> photoService.upload("product", entityId, file))
                .isInstanceOf(PhotoLimitExceededException.class)
                .hasMessageContaining("product");

        verify(storageService, never())
                .upload(anyString(), any(InputStream.class), anyString(), anyLong());
        verify(photoRepository, never()).save(any(Photo.class));
    }

    @Test
    @DisplayName("upload with an unknown entity type throws InvalidFileException")
    void upload_invalidEntityType_throws() throws IOException {
        UUID entityId = UUID.randomUUID();
        MockMultipartFile file = validJpegFile();

        assertThatThrownBy(() -> photoService.upload("invalid", entityId, file))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("Invalid entity type");

        verify(photoRepository, never()).countActiveByEntityTypeAndEntityId(anyString(), any(UUID.class));
        verify(storageService, never())
                .upload(anyString(), any(InputStream.class), anyString(), anyLong());
    }

    @Test
    @DisplayName("upload with an empty file throws InvalidFileException")
    void upload_emptyFile_throws() {
        UUID entityId = UUID.randomUUID();
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.jpg", "image/jpeg", new byte[0]);

        when(photoRepository.countActiveByEntityTypeAndEntityId("product", entityId)).thenReturn(0L);

        assertThatThrownBy(() -> photoService.upload("product", entityId, emptyFile))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("empty");

        verify(storageService, never())
                .upload(anyString(), any(InputStream.class), anyString(), anyLong());
    }

    @Test
    @DisplayName("upload with wrong magic bytes throws InvalidFileException")
    void upload_wrongMagicBytes_throws() {
        UUID entityId = UUID.randomUUID();
        MockMultipartFile fakeJpeg = new MockMultipartFile(
                "file", "fake.jpg", "image/jpeg", "hello world".getBytes());

        when(photoRepository.countActiveByEntityTypeAndEntityId("product", entityId)).thenReturn(0L);

        assertThatThrownBy(() -> photoService.upload("product", entityId, fakeJpeg))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("does not match");

        verify(storageService, never())
                .upload(anyString(), any(InputStream.class), anyString(), anyLong());
        verify(photoRepository, never()).save(any(Photo.class));
    }

    @Test
    @DisplayName("delete of an existing photo removes it and deletes both storage objects")
    void delete_existingPhoto_softDeletesAndCallsStorage() {
        UUID photoId = UUID.randomUUID();
        Photo photo = new Photo();
        photo.setId(photoId);
        photo.setEntityType("product");
        photo.setEntityId(UUID.randomUUID());
        photo.setObjectKey("photos/product/abc/xyz.jpg");
        photo.setOriginalFilename("upload.jpg");
        photo.setContentType("image/jpeg");
        photo.setFileSize(1234L);
        photo.setSortOrder(0);

        when(photoRepository.findById(photoId)).thenReturn(Optional.of(photo));

        photoService.delete(photoId);

        verify(storageService, times(1)).delete("photos/product/abc/xyz.jpg");
        verify(storageService, times(1)).delete("thumbs/product/abc/xyz.jpg");
        verify(photoRepository, times(1)).deleteById(photoId);
    }

    @Test
    @DisplayName("delete of a nonexistent photo throws ResourceNotFoundException")
    void delete_nonexistent_throwsResourceNotFound() {
        UUID photoId = UUID.randomUUID();
        when(photoRepository.findById(photoId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> photoService.delete(photoId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Photo");

        verify(storageService, never()).delete(anyString());
        verify(photoRepository, never()).deleteById(any(UUID.class));
    }
}
