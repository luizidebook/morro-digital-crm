ALTER TABLE `contracts` MODIFY COLUMN `status` enum('draft','sent','waiting_signature','viewed','signed','rejected','cancelled','expired','error') NOT NULL DEFAULT 'draft';
--> statement-breakpoint
ALTER TABLE `contracts` ADD `provider` varchar(50) NOT NULL DEFAULT 'internal';
--> statement-breakpoint
ALTER TABLE `contracts` ADD `providerDocumentId` varchar(255);
--> statement-breakpoint
ALTER TABLE `contracts` ADD `providerSignerId` varchar(255);
--> statement-breakpoint
ALTER TABLE `contracts` ADD `signingUrl` varchar(500);
--> statement-breakpoint
ALTER TABLE `contracts` ADD `signedPdfUrl` varchar(500);
--> statement-breakpoint
ALTER TABLE `contracts` ADD `certificateUrl` varchar(500);
--> statement-breakpoint
ALTER TABLE `contracts` ADD `externalSignatureStatus` varchar(100);
--> statement-breakpoint
ALTER TABLE `contracts` ADD `signaturePayload` json;
--> statement-breakpoint
ALTER TABLE `contracts` ADD `viewedAt` timestamp;
--> statement-breakpoint

CREATE TABLE `signature_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `contractId` int,
  `provider` varchar(50) NOT NULL DEFAULT 'internal',
  `providerEventId` varchar(255),
  `eventType` varchar(100) NOT NULL,
  `rawPayload` json,
  `processed` boolean NOT NULL DEFAULT false,
  `processedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `signature_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

CREATE TABLE `audit_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `entityType` varchar(100) NOT NULL,
  `entityId` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `actorType` varchar(50),
  `actorId` int,
  `ipAddress` varchar(100),
  `userAgent` text,
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
