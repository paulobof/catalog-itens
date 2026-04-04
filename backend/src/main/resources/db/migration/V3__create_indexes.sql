-- FK indexes (PostgreSQL does not create these automatically)
CREATE INDEX idx_location_room_id              ON location (room_id);
CREATE INDEX idx_product_location_product_id   ON product_location (product_id);
CREATE INDEX idx_product_location_location_id  ON product_location (location_id);
CREATE INDEX idx_product_tag_tag_id            ON product_tag (tag_id);
CREATE INDEX idx_photo_entity                  ON photo (entity_type, entity_id);

-- Partial indexes (active records only)
CREATE INDEX idx_room_active_name              ON room (name) WHERE deleted_at IS NULL;
CREATE INDEX idx_location_active_room_name     ON location (room_id, name) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_location_active       ON product_location (product_id, location_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_photo_active_entity_order     ON photo (entity_type, entity_id, sort_order) INCLUDE (object_key) WHERE deleted_at IS NULL;

-- Partial unique indexes (supports soft delete)
CREATE UNIQUE INDEX uq_product_location_active ON product_location (product_id, location_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_tag_name_active         ON tag (name) WHERE deleted_at IS NULL;

-- Full-text search (GIN with tsvector for Portuguese)
CREATE INDEX idx_product_search_vector         ON product USING gin (search_vector) WHERE deleted_at IS NULL;

-- Trigram index for ILIKE on short queries (< 3 chars)
CREATE INDEX idx_product_name_trgm             ON product USING gin (name gin_trgm_ops) WHERE deleted_at IS NULL;

-- Cursor pagination support
CREATE INDEX idx_product_active_name_id        ON product (name, id) WHERE deleted_at IS NULL;
