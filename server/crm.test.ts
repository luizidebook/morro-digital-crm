import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
  getLeads: vi.fn().mockResolvedValue([]),
  getLeadById: vi.fn().mockResolvedValue(null),
  createLead: vi.fn().mockResolvedValue({ id: 1, companyName: "Test Co", stage: "new_lead" }),
  updateLead: vi.fn().mockResolvedValue(undefined),
  getChecklistByLead: vi.fn().mockResolvedValue([]),
  updateChecklistItem: vi.fn().mockResolvedValue(undefined),
  getMeetings: vi.fn().mockResolvedValue([]),
  createMeeting: vi.fn().mockResolvedValue({ id: 1 }),
  getProposals: vi.fn().mockResolvedValue([]),
  createProposal: vi.fn().mockResolvedValue({ id: 1, token: "abc123" }),
  getProposalByToken: vi.fn().mockResolvedValue(null),
  getContracts: vi.fn().mockResolvedValue([]),
  createContract: vi.fn().mockResolvedValue({ id: 1, shareToken: "xyz" }),
  getContractByToken: vi.fn().mockResolvedValue(null),
  updateContract: vi.fn().mockResolvedValue(undefined),
  getFollowUpSettings: vi.fn().mockResolvedValue([]),
  upsertFollowUpSetting: vi.fn().mockResolvedValue(undefined),
  getFollowUps: vi.fn().mockResolvedValue([]),
  getPendingFollowUps: vi.fn().mockResolvedValue([]),
  createFollowUp: vi.fn().mockResolvedValue({ id: 1 }),
  updateFollowUp: vi.fn().mockResolvedValue(undefined),
  getTrials: vi.fn().mockResolvedValue([]),
  createTrial: vi.fn().mockResolvedValue({ id: 1 }),
  updateTrial: vi.fn().mockResolvedValue(undefined),
  getExpiringTrials: vi.fn().mockResolvedValue([]),
  getReferrals: vi.fn().mockResolvedValue([]),
  createReferral: vi.fn().mockResolvedValue({ id: 1 }),
  updateReferral: vi.fn().mockResolvedValue(undefined),
  getInteractions: vi.fn().mockResolvedValue([]),
  addInteraction: vi.fn().mockResolvedValue({ id: 1 }),
  getFunnelMetrics: vi.fn().mockResolvedValue({ stages: [], totalLeads: 0, activeClients: 0, monthlyRevenue: "0", lostLeads: 0 }),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Mensagem de teste gerada pela IA." } }],
  }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@morro.digital",
      name: "Admin Morro Digital",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { cookie: "app_session_id=test-session" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("CRM — Leads Router", () => {
  it("returns empty list when no leads exist", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.leads.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("creates a new lead successfully", async () => {
    const { createLead, getLeads } = await import("./db");
    vi.mocked(createLead).mockResolvedValueOnce(undefined as any);
    vi.mocked(getLeads).mockResolvedValueOnce([{ id: 42, companyName: "Pousada Bela Vista", stage: "new_lead" }] as any);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.leads.create({
      companyName: "Pousada Bela Vista",
      segment: "hospedagem",
      contactName: "João Silva",
      whatsapp: "75999999999",
    });
    // leads.create returns the new lead object
    expect(result).toBeTruthy();
  });
});

describe("CRM — Checklist Router", () => {
  it("returns empty checklist for a lead", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.checklist.getByLead({ leadId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("CRM — Meetings Router", () => {
  it("returns empty meetings list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.meetings.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("CRM — Proposals Router", () => {
  it("creates a proposal and returns token", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.proposals.create({
      leadId: 1,
      title: "Proposta Comercial",
      monthlyValue: "299.00",
    });
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("token");
  });
});

describe("CRM — Contracts Router", () => {
  it("creates a contract successfully", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.contracts.create({
      leadId: 1,
      title: "Contrato de Serviços",
      content: "Corpo do contrato aqui.",
    });
    expect(result).toHaveProperty("success", true);
  });
});

describe("CRM — Follow-ups Router", () => {
  it("returns empty follow-up settings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.followUps.settings();
    expect(Array.isArray(result)).toBe(true);
  });

  it("saves follow-up settings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.followUps.saveSetting({
      name: "Padrão",
      intervalDays: 3,
      maxAttempts: 5,
      isActive: true,
    });
    expect(result).toHaveProperty("success", true);
  });
});

describe("CRM — Metrics Router", () => {
  it("returns funnel metrics", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.metrics.funnel();
    expect(result).toHaveProperty("totalLeads");
    expect(result).toHaveProperty("activeClients");
  });
});

describe("CRM — Referrals Router", () => {
  it("returns empty referrals list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.referrals.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("CRM — LLM Router", () => {
  it("generates a proposal message", async () => {
    const { getLeadById } = await import("./db");
    vi.mocked(getLeadById).mockResolvedValueOnce({
      id: 1,
      companyName: "Restaurante Mar Azul",
      segment: "restaurante",
      contactName: "Maria",
      stage: "proposal_sent",
    } as any);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.llm.generateProposalMessage({ leadId: 1, planName: "Plano Essencial", monthlyValue: "299" });
    expect(result).toHaveProperty("message");
    expect(typeof result.message).toBe("string");
  });
});
