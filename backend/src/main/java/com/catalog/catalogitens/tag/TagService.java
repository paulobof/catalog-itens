package com.catalog.catalogitens.tag;

import com.catalog.catalogitens.exception.ResourceNotFoundException;
import com.catalog.catalogitens.product.ProductTagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final ProductTagRepository productTagRepository;

    @Transactional(readOnly = true)
    public List<TagResponse> findAll() {
        return tagRepository.findAllActive().stream()
                .map(TagResponse::from)
                .toList();
    }

    @Transactional
    public TagResponse create(TagRequest request) {
        Tag tag = new Tag();
        tag.setName(request.name());
        tag.setColor(request.color());
        tag = tagRepository.save(tag);
        log.info("Created tag: {} ({})", tag.getName(), tag.getId());
        return TagResponse.from(tag);
    }

    @Transactional
    public TagResponse update(UUID id, TagRequest request) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", id));
        tag.setName(request.name());
        tag.setColor(request.color());
        tag = tagRepository.save(tag);
        log.info("Updated tag: {} ({})", tag.getName(), tag.getId());
        return TagResponse.from(tag);
    }

    @Transactional
    public void delete(UUID id) {
        tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", id));

        // Hard-delete all ProductTag associations before soft-deleting the tag
        productTagRepository.deleteAllByTagId(id);
        tagRepository.deleteById(id);  // triggers @SQLDelete
        log.warn("Soft-deleted tag: {}", id);
    }
}
