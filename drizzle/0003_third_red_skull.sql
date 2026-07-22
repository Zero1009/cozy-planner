ALTER TABLE `events` ADD `user_id` integer DEFAULT 1 NOT NULL REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `todos` ADD `user_id` integer DEFAULT 1 NOT NULL REFERENCES users(id);