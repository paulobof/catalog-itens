package com.catalog.catalogitens.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Repository
public interface ProductTagRepository extends JpaRepository<ProductTag, ProductTagId> {

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "DELETE FROM product_tag WHERE product_id = :productId", nativeQuery = true)
    void deleteAllByProductId(@Param("productId") UUID productId);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "DELETE FROM product_tag WHERE tag_id = :tagId", nativeQuery = true)
    void deleteAllByTagId(@Param("tagId") UUID tagId);

    @Query(value = "SELECT COUNT(*) > 0 FROM product_tag WHERE product_id = :productId AND tag_id = :tagId",
           nativeQuery = true)
    boolean existsByProductIdAndTagId(@Param("productId") UUID productId, @Param("tagId") UUID tagId);
}
