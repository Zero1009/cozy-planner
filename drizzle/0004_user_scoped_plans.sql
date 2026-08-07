ALTER TABLE `events` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `todos` ADD `user_id` integer REFERENCES users(id);