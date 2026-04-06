-- App users for authentication (no registration, seeded by application)
CREATE TABLE app_user (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    name       VARCHAR(100),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
