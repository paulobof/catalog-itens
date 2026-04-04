package com.catalog.catalogitens.product;

import com.catalog.catalogitens.tag.Tag;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_tag")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"product", "tag"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@IdClass(ProductTagId.class)
public class ProductTag {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    @EqualsAndHashCode.Include
    private Product product;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tag_id", nullable = false)
    @EqualsAndHashCode.Include
    private Tag tag;
}
