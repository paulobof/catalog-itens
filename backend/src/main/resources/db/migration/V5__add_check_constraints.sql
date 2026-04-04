-- ProductLocation: quantity must be positive
ALTER TABLE product_location
    ADD CONSTRAINT chk_product_location_quantity CHECK (quantity > 0);

-- Tag: color must be a valid 6-digit hex color (or null)
ALTER TABLE tag
    ADD CONSTRAINT chk_tag_color CHECK (color IS NULL OR color ~ '^#[0-9a-fA-F]{6}$');

-- Photo: sort_order must be non-negative
ALTER TABLE photo
    ADD CONSTRAINT chk_photo_sort_order CHECK (sort_order >= 0);

-- Photo: entity_type must be one of the known types
ALTER TABLE photo
    ADD CONSTRAINT chk_photo_entity_type CHECK (entity_type IN ('product', 'location', 'room'));
