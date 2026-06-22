CREATE TABLE `affiliate_product` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`image_url` text,
	`price_cents` integer,
	`currency` text DEFAULT 'usd' NOT NULL,
	`category` text,
	`network` text NOT NULL,
	`product_url` text NOT NULL,
	`external_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `affiliate_product_network_idx` ON `affiliate_product` (`network`);--> statement-breakpoint
CREATE TABLE `creator_affiliate_account` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`network` text NOT NULL,
	`tag` text NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `creator_affiliate_account_unique` ON `creator_affiliate_account` (`profile_id`,`network`);--> statement-breakpoint
CREATE TABLE `creator_affiliate_product` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`affiliate_product_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`affiliate_product_id`) REFERENCES `affiliate_product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `creator_affiliate_profileId_idx` ON `creator_affiliate_product` (`profile_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `creator_affiliate_unique` ON `creator_affiliate_product` (`profile_id`,`affiliate_product_id`);--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `order` ADD `shipping_name` text;--> statement-breakpoint
ALTER TABLE `order` ADD `shipping_address` text;--> statement-breakpoint
ALTER TABLE `product` ADD `kind` text DEFAULT 'digital' NOT NULL;