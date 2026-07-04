import { and, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  ChecklistItem,
  InsertUser,
  auditLogs,
  checklistItems,
  contracts,
  followUpSettings,
  followUps,
  interactions,
  leads,
  meetings,
  proposals,
  referrals,
  signatureEvents,
  trials,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Leads ────────────────────────────────────────────────────────────────────
export async function getLeads(filters?: { stage?: string; status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(leads).$dynamic();
  const conditions = [];
  if (filters?.stage) conditions.push(eq(leads.stage, filters.stage as any));
  if (filters?.status) conditions.push(eq(leads.status, filters.status as any));
  if (filters?.search) {
    conditions.push(
      or(
        sql`${leads.companyName} LIKE ${`%${filters.search}%`}`,
        sql`${leads.contactName} LIKE ${`%${filters.search}%`}`,
        sql`${leads.whatsapp} LIKE ${`%${filters.search}%`}`
      )
    );
  }
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(desc(leads.updatedAt));
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0];
}

export async function createLead(data: typeof leads.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(leads).values(data);
  return result[0];
}

export async function updateLead(id: number, data: Partial<typeof leads.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(leads).where(eq(leads.id, id));
}

// ─── Checklist ────────────────────────────────────────────────────────────────
export const CHECKLIST_STEPS = [
  { step: "first_contact", label: "Primeiro Contato", description: "Mensagem inicial enviada via WhatsApp" },
  { step: "meeting_scheduled", label: "Reunião Agendada", description: "Reunião presencial ou online marcada" },
  { step: "meeting_done", label: "Reunião Realizada", description: "Apresentação do projeto concluída" },
  { step: "proposal_sent", label: "Proposta Enviada", description: "Proposta personalizada enviada ao cliente" },
  { step: "proposal_accepted", label: "Proposta Aceita", description: "Cliente aceitou os termos da proposta" },
  { step: "trial_started", label: "Trial Iniciado", description: "Período de teste ativado para o cliente" },
  { step: "contract_drafted", label: "Contrato Redigido", description: "Contrato elaborado com dados do cliente" },
  { step: "contract_sent", label: "Contrato Enviado", description: "Contrato enviado para assinatura" },
  { step: "contract_signed", label: "Contrato Assinado", description: "Contrato assinado pelo cliente" },
  { step: "payment_received", label: "Pagamento Recebido", description: "Primeiro pagamento confirmado" },
  { step: "data_collected", label: "Dados Coletados", description: "Informações da empresa coletadas para o site" },
  { step: "photo_visit_scheduled", label: "Visita Fotográfica Agendada", description: "Data da visita para fotos marcada" },
  { step: "photo_visit_done", label: "Visita Fotográfica Realizada", description: "Fotos do local produzidas" },
  { step: "site_updated", label: "Site Atualizado", description: "Página da empresa publicada no site" },
  { step: "announced", label: "Parceria Divulgada", description: "Nova parceria anunciada nas redes sociais" },
  { step: "feedback_collected", label: "Feedback Coletado", description: "Avaliação do cliente registrada" },
] as const;

export async function getChecklistByLead(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checklistItems).where(eq(checklistItems.leadId, leadId));
}

export async function initializeChecklist(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getChecklistByLead(leadId);
  const existingSteps = new Set(existing.map((i) => i.step));
  const toInsert = CHECKLIST_STEPS.filter((s) => !existingSteps.has(s.step)).map((s) => ({
    leadId,
    step: s.step,
    completed: false,
  }));
  if (toInsert.length > 0) await db.insert(checklistItems).values(toInsert);
}

export async function toggleChecklistItem(id: number, completed: boolean, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(checklistItems).set({
    completed,
    completedAt: completed ? new Date() : null,
    completedById: completed ? userId : null,
  }).where(eq(checklistItems.id, id));
}

// ─── Meetings ─────────────────────────────────────────────────────────────────
export async function getMeetings(leadId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (leadId) return db.select().from(meetings).where(eq(meetings.leadId, leadId)).orderBy(desc(meetings.scheduledAt));
  return db.select().from(meetings).orderBy(desc(meetings.scheduledAt));
}

export async function createMeeting(data: typeof meetings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(meetings).values(data);
}

export async function updateMeeting(id: number, data: Partial<typeof meetings.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(meetings).set(data).where(eq(meetings.id, id));
}

// ─── Proposals ────────────────────────────────────────────────────────────────
export async function getProposals(leadId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (leadId) return db.select().from(proposals).where(eq(proposals.leadId, leadId)).orderBy(desc(proposals.createdAt));
  return db.select().from(proposals).orderBy(desc(proposals.createdAt));
}


export async function getProposalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  return result[0];
}

export async function getProposalByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(proposals).where(eq(proposals.shareToken, token)).limit(1);
  return result[0];
}

export async function createProposal(data: typeof proposals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(proposals).values(data);
}

export async function updateProposal(id: number, data: Partial<typeof proposals.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(proposals).set(data).where(eq(proposals.id, id));
}

// ─── Contracts ────────────────────────────────────────────────────────────────
export async function getContracts(leadId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (leadId) return db.select().from(contracts).where(eq(contracts.leadId, leadId)).orderBy(desc(contracts.createdAt));
  return db.select().from(contracts).orderBy(desc(contracts.createdAt));
}


export async function getContractById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return result[0];
}

export async function getActiveContractByProposalId(proposalId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts)
    .where(and(eq(contracts.proposalId, proposalId), sql`${contracts.status} NOT IN ('signed', 'cancelled', 'rejected', 'expired')`))
    .limit(1);
  return result[0];
}

export async function getContractByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts).where(eq(contracts.shareToken, token)).limit(1);
  return result[0];
}

export async function createContract(data: typeof contracts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(contracts).values(data);
}

export async function updateContract(id: number, data: Partial<typeof contracts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contracts).set(data).where(eq(contracts.id, id));
}


export async function createSignatureEvent(data: typeof signatureEvents.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(signatureEvents).values(data);
}

export async function createAuditLog(data: typeof auditLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(auditLogs).values(data);
}

// ─── Interactions ─────────────────────────────────────────────────────────────
export async function getInteractions(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interactions).where(eq(interactions.leadId, leadId)).orderBy(desc(interactions.createdAt));
}

export async function addInteraction(data: typeof interactions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(interactions).values(data);
}

// ─── Follow-ups ───────────────────────────────────────────────────────────────
export async function getFollowUpSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(followUpSettings).orderBy(followUpSettings.name);
}

export async function getFollowUps(leadId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (leadId) return db.select().from(followUps).where(eq(followUps.leadId, leadId)).orderBy(desc(followUps.scheduledAt));
  return db.select().from(followUps).orderBy(desc(followUps.scheduledAt));
}

export async function getPendingFollowUps() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(followUps)
    .where(and(eq(followUps.status, "pending"), lte(followUps.scheduledAt, new Date())))
    .orderBy(followUps.scheduledAt);
}

export async function createFollowUp(data: typeof followUps.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(followUps).values(data);
}

export async function updateFollowUp(id: number, data: Partial<typeof followUps.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(followUps).set(data).where(eq(followUps.id, id));
}

export async function upsertFollowUpSetting(data: typeof followUpSettings.$inferInsert & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (data.id) {
    await db.update(followUpSettings).set(data).where(eq(followUpSettings.id, data.id));
  } else {
    await db.insert(followUpSettings).values(data);
  }
}

// ─── Trials ───────────────────────────────────────────────────────────────────
export async function getTrials(leadId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (leadId) return db.select().from(trials).where(eq(trials.leadId, leadId)).orderBy(desc(trials.createdAt));
  return db.select().from(trials).orderBy(desc(trials.createdAt));
}

export async function getExpiringTrials(daysAhead: number = 3) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return db.select().from(trials).where(
    and(eq(trials.status, "active"), lte(trials.endDate, future), gte(trials.endDate, now))
  );
}

export async function createTrial(data: typeof trials.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(trials).values(data);
}

export async function updateTrial(id: number, data: Partial<typeof trials.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(trials).set(data).where(eq(trials.id, id));
}

// ─── Referrals ────────────────────────────────────────────────────────────────
export async function getReferrals(referrerLeadId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (referrerLeadId) return db.select().from(referrals).where(eq(referrals.referrerLeadId, referrerLeadId)).orderBy(desc(referrals.createdAt));
  return db.select().from(referrals).orderBy(desc(referrals.createdAt));
}

export async function createReferral(data: typeof referrals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(referrals).values(data);
}

export async function updateReferral(id: number, data: Partial<typeof referrals.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(referrals).set(data).where(eq(referrals.id, id));
}

// ─── Metrics ──────────────────────────────────────────────────────────────────
export async function getFunnelMetrics() {
  const db = await getDb();
  if (!db) return null;

  const allLeads = await db.select().from(leads);
  const total = allLeads.length;
  const active = allLeads.filter((l) => l.status === "active").length;
  const converted = allLeads.filter((l) => l.stage === "active_client").length;
  const lost = allLeads.filter((l) => l.status === "lost" || l.stage === "lost").length;

  const stageGroups: Record<string, number> = {};
  for (const lead of allLeads) {
    stageGroups[lead.stage] = (stageGroups[lead.stage] || 0) + 1;
  }

  const totalRevenue = allLeads
    .filter((l) => l.stage === "active_client" && l.monthlyValue)
    .reduce((sum, l) => sum + parseFloat(String(l.monthlyValue || 0)), 0);

  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  // Calcular taxa de conversão por etapa do funil
  const stageOrder = [
    "new_lead", "first_contact", "meeting_scheduled", "proposal_sent",
    "trial", "negotiating", "contract_sent", "contract_signed",
    "payment_pending", "onboarding", "active_client",
  ];
  const stageConversion: Array<{ stage: string; count: number; conversionRate: number }> = [];
  for (let i = 0; i < stageOrder.length; i++) {
    const stage = stageOrder[i];
    const count = stageGroups[stage] || 0;
    const prevStage = i > 0 ? stageOrder[i - 1] : null;
    const prevCount = prevStage ? (stageGroups[prevStage] || 0) : total;
    const rate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
    stageConversion.push({ stage, count, conversionRate: rate });
  }

  const recentLeads = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(5);
  const recentInteractions = await db.select().from(interactions).orderBy(desc(interactions.createdAt)).limit(10);

  return {
    total,
    active,
    converted,
    lost,
    conversionRate,
    totalRevenue,
    stageGroups,
    stageConversion,
    recentLeads,
    recentInteractions,
  };
}