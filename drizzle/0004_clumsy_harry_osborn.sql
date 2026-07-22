CREATE TABLE `login_attempts` (
	`username` text PRIMARY KEY NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
