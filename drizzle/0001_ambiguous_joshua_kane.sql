CREATE TABLE `checklist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`step` enum('first_contact','meeting_scheduled','meeting_done','proposal_sent','proposal_accepted','trial_started','contract_drafted','contract_sent','contract_signed','payment_received','data_collected','photo_visit_scheduled','photo_visit_done','site_updated','announced','feedback_collected') NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`completedById` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checklist_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`proposalId` int,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`monthlyValue` decimal(10,2),
	`status` enum('draft','sent','signed','cancelled') NOT NULL DEFAULT 'draft',
	`shareToken` varchar(64),
	`sentAt` timestamp,
	`signedAt` timestamp,
	`signatureData` text,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follow_up_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`intervalDays` int NOT NULL DEFAULT 3,
	`maxAttempts` int NOT NULL DEFAULT 5,
	`messageTemplate` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `follow_up_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follow_ups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`settingId` int,
	`attemptNumber` int NOT NULL DEFAULT 1,
	`status` enum('pending','sent','responded','skipped') NOT NULL DEFAULT 'pending',
	`generatedMessage` text,
	`scheduledAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`respondedAt` timestamp,
	`scheduleCronTaskUid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `follow_ups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`type` enum('note','whatsapp','call','email','meeting','stage_change','proposal','contract','payment','follow_up','system') NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`segment` varchar(100),
	`contactName` varchar(255),
	`phone` varchar(30),
	`whatsapp` varchar(30),
	`email` varchar(320),
	`address` text,
	`website` varchar(255),
	`notes` text,
	`stage` enum('new_lead','first_contact','meeting_scheduled','proposal_sent','trial','contract_sent','contract_signed','payment_pending','payment_done','onboarding','photo_visit_scheduled','photo_visit_done','published','announced','feedback','active_client','churned','lost') NOT NULL DEFAULT 'new_lead',
	`status` enum('active','inactive','lost') NOT NULL DEFAULT 'active',
	`source` varchar(100),
	`referredById` int,
	`assignedToId` int,
	`monthlyValue` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastContactAt` timestamp,
	`convertedAt` timestamp,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`modality` enum('in_person','online') NOT NULL,
	`meetingLink` varchar(500),
	`location` text,
	`status` enum('scheduled','done','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`planName` varchar(100),
	`monthlyValue` decimal(10,2) NOT NULL,
	`setupFee` decimal(10,2),
	`trialDays` int DEFAULT 0,
	`features` json,
	`customMessage` text,
	`pdfUrl` varchar(500),
	`shareToken` varchar(64),
	`status` enum('draft','sent','viewed','accepted','rejected') NOT NULL DEFAULT 'draft',
	`sentAt` timestamp,
	`viewedAt` timestamp,
	`respondedAt` timestamp,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerLeadId` int NOT NULL,
	`referredLeadId` int,
	`referredName` varchar(255),
	`referredPhone` varchar(30),
	`referredEmail` varchar(320),
	`status` enum('pending','contacted','converted','lost') NOT NULL DEFAULT 'pending',
	`benefitDescription` text,
	`benefitGrantedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`durationDays` int NOT NULL DEFAULT 30,
	`status` enum('active','expired','converted','cancelled') NOT NULL DEFAULT 'active',
	`convertedAt` timestamp,
	`notifiedAt` timestamp,
	`scheduleCronTaskUid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trials_id` PRIMARY KEY(`id`)
);
