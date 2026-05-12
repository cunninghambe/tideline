CREATE TABLE `daily_checkins` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`sleep_hours` real,
	`sleep_quality` integer,
	`stress_level` integer,
	`water_cups` integer,
	`caffeine_cups` integer,
	`food_tag_ids` text DEFAULT '[]' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`synced_at` integer,
	`pooled_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_checkins_date_unique` ON `daily_checkins` (`date`);--> statement-breakpoint
CREATE TABLE `food_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `food_tags_name_unique` ON `food_tags` (`name`);--> statement-breakpoint
CREATE TABLE `cycle_events` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`event_type` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `migraine_events` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`peak_severity` integer NOT NULL,
	`symptom_tags` text DEFAULT '[]' NOT NULL,
	`helpers` text DEFAULT '[]' NOT NULL,
	`post_state` text,
	`notes` text,
	`weather_snapshot_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`synced_at` integer,
	`pooled_at` integer,
	FOREIGN KEY (`weather_snapshot_id`) REFERENCES `weather_snapshots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `medication_doses` (
	`id` text PRIMARY KEY NOT NULL,
	`medication_id` text NOT NULL,
	`migraine_event_id` text,
	`taken_at` integer NOT NULL,
	`dose_amount` text NOT NULL,
	`effectiveness_rating` text,
	`time_to_relief_minutes` integer,
	FOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`migraine_event_id`) REFERENCES `migraine_events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_name` text NOT NULL,
	`medication_class` text NOT NULL,
	`default_dose` text NOT NULL,
	`type` text NOT NULL,
	`pills_remaining` integer,
	`refill_threshold` integer DEFAULT 7 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `device_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`weather_snapshot_id` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	FOREIGN KEY (`weather_snapshot_id`) REFERENCES `weather_snapshots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `weather_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`captured_at` integer NOT NULL,
	`h3_cell` text NOT NULL,
	`temperature_c` real,
	`humidity_pct` real,
	`pressure_hpa` real,
	`pressure_change_24h_hpa` real,
	`wind_kph` real,
	`uv_index` real,
	`pollen_index` text,
	`source` text DEFAULT 'open-meteo' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`operation` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
