CREATE TABLE reading_plans (
    id UUID PRIMARY KEY,
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    max_participants INT NOT NULL DEFAULT 3,
    contact_phone VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    emails_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE reading_plan_participants (
    id UUID PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP NOT NULL,
    UNIQUE (plan_id, user_id)
);
