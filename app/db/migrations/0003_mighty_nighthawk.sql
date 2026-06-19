CREATE TABLE `membership` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`tier_id` text,
	`supporter_user_id` text NOT NULL,
	`stripe_subscription_id` text NOT NULL,
	`stripe_customer_id` text,
	`status` text DEFAULT 'incomplete' NOT NULL,
	`current_period_end` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tier_id`) REFERENCES `tier`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`supporter_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `membership_stripe_subscription_id_unique` ON `membership` (`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `membership_profileId_idx` ON `membership` (`profile_id`);--> statement-breakpoint
CREATE INDEX `membership_supporter_idx` ON `membership` (`supporter_user_id`);--> statement-breakpoint
CREATE TABLE `tier` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price_cents` integer NOT NULL,
	`interval` text DEFAULT 'month' NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`benefits` text DEFAULT '[]',
	`image_url` text,
	`accent_color` text DEFAULT 'primary' NOT NULL,
	`stripe_product_id` text,
	`stripe_price_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`member_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tier_profileId_idx` ON `tier` (`profile_id`);