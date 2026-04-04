-- Room (Cômodo)
CREATE TABLE room (
    id          UUID        NOT NULL DEFAULT uuid_generate_v7(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    CONSTRAINT pk_room PRIMARY KEY (id)
);

-- Location (Local de armazenamento)
CREATE TABLE location (
    id          UUID        NOT NULL DEFAULT uuid_generate_v7(),
    room_id     UUID        NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    CONSTRAINT pk_location PRIMARY KEY (id),
    CONSTRAINT fk_location_room FOREIGN KEY (room_id) REFERENCES room (id) ON DELETE RESTRICT
);

-- Product (Produto/Item)
CREATE TABLE product (
    id             UUID         NOT NULL DEFAULT uuid_generate_v7(),
    name           VARCHAR(150) NOT NULL,
    description    TEXT,
    search_vector  TSVECTOR GENERATED ALWAYS AS (
                       to_tsvector('portuguese',
                           coalesce(name, '') || ' ' || coalesce(description, ''))
                   ) STORED,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ,
    CONSTRAINT pk_product PRIMARY KEY (id)
);

-- ProductLocation (Junção N:N com quantidade)
CREATE TABLE product_location (
    id          UUID    NOT NULL DEFAULT uuid_generate_v7(),
    product_id  UUID    NOT NULL,
    location_id UUID    NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    CONSTRAINT pk_product_location PRIMARY KEY (id),
    CONSTRAINT fk_product_location_product  FOREIGN KEY (product_id)  REFERENCES product  (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_location_location FOREIGN KEY (location_id) REFERENCES location (id) ON DELETE CASCADE
);

-- Tag
CREATE TABLE tag (
    id         UUID        NOT NULL DEFAULT uuid_generate_v7(),
    name       VARCHAR(50) NOT NULL,
    color      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT pk_tag PRIMARY KEY (id)
);

-- ProductTag (Junção N:N — hard delete)
CREATE TABLE product_tag (
    product_id UUID NOT NULL,
    tag_id     UUID NOT NULL,
    CONSTRAINT pk_product_tag PRIMARY KEY (product_id, tag_id),
    CONSTRAINT fk_product_tag_product FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_tag_tag     FOREIGN KEY (tag_id)     REFERENCES tag     (id) ON DELETE CASCADE
);

-- Photo
CREATE TABLE photo (
    id                UUID         NOT NULL DEFAULT uuid_generate_v7(),
    entity_type       TEXT         NOT NULL,
    entity_id         UUID         NOT NULL,
    object_key        TEXT         NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type      VARCHAR(100) NOT NULL,
    file_size         BIGINT       NOT NULL,
    sort_order        INTEGER      NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ,
    CONSTRAINT pk_photo PRIMARY KEY (id)
);
