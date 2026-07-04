import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  decimal,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  segment: varchar("segment", { length: 100 }),
  contactName: varchar("contactName", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  whatsapp: varchar("whatsapp", { length: 30 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  website: varchar("website", { length: 255 }),
  notes: text("notes"),
  stage: mysqlEnum("stage", [
    "new_lead",
    "first_contact",
    "meeting_scheduled",
    "proposal_sent",
    "trial",
    "contract_sent",
    "contract_signed",
    "payment_pending",
    "payment_done",
    "onboarding",
    "photo_visit_scheduled",
    "photo_visit_done",
    "published",
    "announced",
    "feedback",
    "active_client",
    "churned",
    "lost",
  ]).default("new_lead").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "lost"]).default("active").notNull(),
  source: varchar("source", { length: 100 }),
  referredById: int("referredById"),
  assignedToId: int("assignedToId"),
  monthlyValue: decimal("monthlyValue", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastContactAt: timestamp("lastContactAt"),
  convertedAt: timestamp("convertedAt"),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export const checklistItems = mysqlTable("checklist_items", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  step: mysqlEnum("step", [
    "first_contact",
    "meeting_scheduled",
    "meeting_done",
    "proposal_sent",
    "proposal_accepted",
    "trial_started",
    "contract_drafted",
    "contract_sent",
    "contract_signed",
    "payment_received",
    "data_collected",
    "photo_visit_scheduled",
    "photo_visit_done",
    "site_updated",
    "announced",
    "feedback_collected",
  ]).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  completedById: int("completedById"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;

export const meetings = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  modality: mysqlEnum("modality", ["in_person", "online"]).notNull(),
  meetingLink: varchar("meetingLink", { length: 500 }),
  location: text("location"),
  status: mysqlEnum("status", ["scheduled", "done", "cancelled", "no_show"]).default("scheduled").notNull(),
  notes: text("notes"),
  createdById: int("createdById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  planName: varchar("planName", { length: 100 }),
  monthlyValue: decimal("monthlyValue", { precision: 10, scale: 2 }).notNull(),
  setupFee: decimal("setupFee", { precision: 10, scale: 2 }),
  trialDays: int("trialDays").default(0),
  features: json("features"),
  customMessage: text("customMessage"),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  shareToken: varchar("shareToken", { length: 64 }),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "accepted", "rejected"]).default("draft").notNull(),
  sentAt: timestamp("sentAt"),
  viewedAt: timestamp("viewedAt"),
  respondedAt: timestamp("respondedAt"),
  createdById: int("createdById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  proposalId: int("proposalId"),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  monthlyValue: decimal("monthlyValue", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", [
    "draft",
    "sent",
    "waiting_signature",
    "viewed",
    "signed",
    "rejected",
    "cancelled",
    "expired",
    "error",
  ]).default("draft").notNull(),
  shareToken: varchar("shareToken", { length: 64 }),
  provider: varchar("provider", { length: 50 }).default("internal").notNull(),
  providerDocumentId: varchar("providerDocumentId", { length: 255 }),
  providerSignerId: varchar("providerSignerId", { length: 255 }),
  signingUrl: varchar("signingUrl", { length: 500 }),
  signedPdfUrl: varchar("signedPdfUrl", { length: 500 }),
  certificateUrl: varchar("certificateUrl", { length: 500 }),
  externalSignatureStatus: varchar("externalSignatureStatus", { length: 100 }),
  signaturePayload: json("signaturePayload"),
  sentAt: timestamp("sentAt"),
  viewedAt: timestamp("viewedAt"),
  signedAt: timestamp("signedAt"),
  signatureData: text("signatureData"),
  createdById: int("createdById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

export const signatureEvents = mysqlTable("signature_events", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId"),
  provider: varchar("provider", { length: 50 }).default("internal").notNull(),
  providerEventId: varchar("providerEventId", { length: 255 }),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  rawPayload: json("rawPayload"),
  processed: boolean("processed").default(false).notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SignatureEvent = typeof signatureEvents.$inferSelect;
export type InsertSignatureEvent = typeof signatureEvents.$inferInsert;

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  actorType: varchar("actorType", { length: 50 }),
  actorId: int("actorId"),
  ipAddress: varchar("ipAddress", { length: 100 }),
  userAgent: text("userAgent"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export const interactions = mysqlTable("interactions", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  type: mysqlEnum("type", [
    "note",
    "whatsapp",
    "call",
    "email",
    "meeting",
    "stage_change",
    "proposal",
    "contract",
    "payment",
    "follow_up",
    "system",
  ]).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  createdById: int("createdById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

export const followUpSettings = mysqlTable("follow_up_settings", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  intervalDays: int("intervalDays").notNull().default(3),
  maxAttempts: int("maxAttempts").notNull().default(5),
  messageTemplate: text("messageTemplate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FollowUpSetting = typeof followUpSettings.$inferSelect;

export const followUps = mysqlTable("follow_ups", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  settingId: int("settingId"),
  attemptNumber: int("attemptNumber").default(1).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "responded", "skipped"]).default("pending").notNull(),
  generatedMessage: text("generatedMessage"),
  scheduledAt: timestamp("scheduledAt").notNull(),
  sentAt: timestamp("sentAt"),
  respondedAt: timestamp("respondedAt"),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FollowUp = typeof followUps.$inferSelect;

export const trials = mysqlTable("trials", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  durationDays: int("durationDays").notNull().default(30),
  status: mysqlEnum("status", ["active", "expired", "converted", "cancelled"]).default("active").notNull(),
  convertedAt: timestamp("convertedAt"),
  notifiedAt: timestamp("notifiedAt"),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trial = typeof trials.$inferSelect;

export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerLeadId: int("referrerLeadId").notNull(),
  referredLeadId: int("referredLeadId"),
  referredName: varchar("referredName", { length: 255 }),
  referredPhone: varchar("referredPhone", { length: 30 }),
  referredEmail: varchar("referredEmail", { length: 320 }),
  status: mysqlEnum("status", ["pending", "contacted", "converted", "lost"]).default("pending").notNull(),
  benefitDescription: text("benefitDescription"),
  benefitGrantedAt: timestamp("benefitGrantedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
