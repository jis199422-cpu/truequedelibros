CREATE TABLE locales (
    id         UUID         PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    address    VARCHAR(255) NOT NULL,
    logo_url   VARCHAR(500),
    category   VARCHAR(50)  NOT NULL,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    owner_id   UUID         NOT NULL REFERENCES users(id),
    created_at TIMESTAMP    NOT NULL,
    updated_at TIMESTAMP    NOT NULL
);

CREATE TABLE promociones (
    id          UUID         PRIMARY KEY,
    local_id    UUID         NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP    NOT NULL
);

CREATE TABLE cupones (
    id                   UUID        PRIMARY KEY,
    user_id              UUID        NOT NULL REFERENCES users(id),
    local_id             UUID        NOT NULL REFERENCES locales(id),
    promocion_id         UUID        NOT NULL REFERENCES promociones(id),
    code                 VARCHAR(10) NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    expires_at           TIMESTAMP   NOT NULL,
    created_at           TIMESTAMP   NOT NULL,
    validated_at         TIMESTAMP,
    validated_by_user_id UUID        REFERENCES users(id),
    CONSTRAINT uq_cupon_code UNIQUE (code)
);

CREATE UNIQUE INDEX uq_cupon_pendiente_user_local
    ON cupones (user_id, local_id)
    WHERE status = 'PENDIENTE';

CREATE INDEX idx_cupones_expires_at ON cupones (expires_at) WHERE status = 'PENDIENTE';
CREATE INDEX idx_cupones_local_id   ON cupones (local_id);
CREATE INDEX idx_cupones_user_id    ON cupones (user_id);

CREATE TABLE cupon_attempts (
    id              UUID        PRIMARY KEY,
    user_id         UUID,
    ip_address      VARCHAR(45) NOT NULL,
    local_id        UUID        NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
    failed_attempts INT         NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP   NOT NULL,
    banned_until    TIMESTAMP,
    CONSTRAINT uq_attempt_user_local UNIQUE (user_id, local_id)
);
