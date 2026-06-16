CREATE TABLE managed_exchange_interests (
    id              UUID      PRIMARY KEY,
    user_id         UUID      NOT NULL REFERENCES users(id),
    conversation_id UUID,
    created_at      TIMESTAMP NOT NULL
);
