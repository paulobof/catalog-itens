package com.catalog.catalogitens.product;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ProductTagId implements Serializable {

    private UUID product;
    private UUID tag;

    public ProductTagId() {}

    public ProductTagId(UUID product, UUID tag) {
        this.product = product;
        this.tag = tag;
    }

    public UUID getProduct() { return product; }
    public void setProduct(UUID product) { this.product = product; }

    public UUID getTag() { return tag; }
    public void setTag(UUID tag) { this.tag = tag; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProductTagId that)) return false;
        return Objects.equals(product, that.product) &&
               Objects.equals(tag, that.tag);
    }

    @Override
    public int hashCode() {
        return Objects.hash(product, tag);
    }
}
