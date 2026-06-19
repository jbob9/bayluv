CREATE TABLE `payment_account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`stripe_account_id` text NOT NULL,
	`charges_enabled` integer DEFAULT false NOT NULL,
	`payouts_enabled` integer DEFAULT false NOT NULL,
	`details_submitted` integer DEFAULT false NOT NULL,
	`country` text,
	`default_currency` text DEFAULT 'usd',
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_account_user_id_unique` ON `payment_account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_account_stripe_account_id_unique` ON `payment_account` (`stripe_account_id`);--> statement-breakpoint
CREATE INDEX `payment_account_userId_idx` ON `payment_account` (`user_id`);--> statement-breakpoint
CREATE TABLE `support` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`supporter_user_id` text,
	`supporter_name` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`amount_cents` integer NOT NULL,
	`fee_cents` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`message` text,
	`is_public` integer DEFAULT true NOT NULL,
	`is_monthly` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`stripe_checkout_session_id` text,
	`stripe_payment_intent_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`supporter_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `support_stripe_checkout_session_id_unique` ON `support` (`stripe_checkout_session_id`);--> statement-breakpoint
CREATE INDEX `support_profileId_idx` ON `support` (`profile_id`);--> statement-breakpoint
CREATE INDEX `support_status_idx` ON `support` (`status`);