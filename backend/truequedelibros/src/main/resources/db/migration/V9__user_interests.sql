CREATE TABLE user_interests (
    id          UUID         PRIMARY KEY,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest    VARCHAR(60)  NOT NULL,
    custom_text VARCHAR(255) NULL,
    created_at  TIMESTAMP    NOT NULL,
    CONSTRAINT uq_user_interest UNIQUE (user_id, interest)
);
