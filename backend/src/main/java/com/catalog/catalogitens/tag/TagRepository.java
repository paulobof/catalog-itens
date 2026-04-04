package com.catalog.catalogitens.tag;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {

    @Query("SELECT t FROM Tag t ORDER BY t.name ASC")
    List<Tag> findAllActive();

    boolean existsByNameIgnoreCase(String name);
}
