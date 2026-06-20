CREATE TABLE `post` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`cover_url` text,
	`visibility` text DEFAULT 'public' NOT NULL,
	`min_tier_id` text,
	`is_published` integer DEFAULT true NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`min_tier_id`) REFERENCES `tier`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `post_profileId_idx` ON `post` (`profile_id`);--> statement-breakpoint
CREATE TABLE `broadcast` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`recipient_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `broadcast_profileId_idx` ON `broadcast` (`profile_id`);--> statement-breakpoint
ALTER TABLE `profile` ADD `layout` text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `page_views` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `support` ADD `supporter_email` text;--> statement-breakpoint
ALTER TABLE `tier` ADD `yearly_price_cents` integer;--> statement-breakpoint
ALTER TABLE `tier` ADD `stripe_yearly_price_id` text;