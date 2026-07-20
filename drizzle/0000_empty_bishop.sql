CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`category` text DEFAULT 'personal' NOT NULL,
	`custom_category_label` text,
	`date` text NOT NULL,
	`time` text DEFAULT '09:00' NOT NULL,
	`end_time` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`custom_category_label` text,
	`priority` text DEFAULT 'med' NOT NULL,
	`due` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
