ALTER TABLE users ADD COLUMN notify_on_new_message BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN notify_on_book_like BOOLEAN NOT NULL DEFAULT true;
