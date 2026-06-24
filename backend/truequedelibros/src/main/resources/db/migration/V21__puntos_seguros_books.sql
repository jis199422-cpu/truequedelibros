ALTER TABLE locales ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE locales ADD COLUMN longitude DOUBLE PRECISION;

ALTER TABLE books ADD COLUMN local_id UUID REFERENCES locales(id);
CREATE INDEX idx_books_local_id ON books(local_id) WHERE local_id IS NOT NULL;
