ALTER TABLE users ADD COLUMN wishlist_notify_on_match BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN wishlist_notify_external_purchase BOOLEAN NOT NULL DEFAULT false;
