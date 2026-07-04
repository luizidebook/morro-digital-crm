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
