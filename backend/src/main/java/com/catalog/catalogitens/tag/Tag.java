package com.catalog.catalogitens.tag;

import com.catalog.catalogitens.product.ProductTag;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tag")
@SQLDelete(sql = "UPDATE tag SET deleted_at = now() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = "productTags")
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Tag {

    @Id
    @EqualsAndHashCode.Include
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "color")
    private String color;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @OneToMany(mappedBy = "tag", fetch = FetchType.LAZY)
    private List<ProductTag> productTags = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
