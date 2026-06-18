CREATE TABLE product_events (
    id         UUID         PRIMARY KEY,
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_name VARCHAR(100) NOT NULL,
    metadata   TEXT,
    created_at TIMESTAMP    NOT NULL
);

CREATE INDEX idx_product_events_event_name ON product_events(event_name);
CREATE INDEX idx_product_events_user_id    ON product_events(user_id);
