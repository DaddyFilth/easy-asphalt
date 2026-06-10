-- Add MFA security fields to users table
ALTER TABLE `users` ADD `mfaEnabled` int NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `users` ADD `totpSecret` varchar(255);
--> statement-breakpoint
ALTER TABLE `users` ADD `backupCodes` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `mfaVerifiedAt` timestamp;