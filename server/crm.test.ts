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
    createProposal: vi.fn().mockResolvedValue({ id: 1, shareToken: "abc123" }),
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
    // getFunnelMetrics retorna o shape real: total, active, converted, lost, etc.
    getFunnelMetrics: vi.fn().mockResolvedValue({
      total: 10,
      active: 5,
      converted: 3,
      lost: 2,
      conversionRate: 30,
      totalRevenue: 1500,
      stageGroups: { new_lead: 2, first_contact: 3 },
      stageConversion: [],
      recentLeads: [],
      recentInteractions: [],
    }),
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

// ─── Leads ────────────────────────────────────────────────────────────────────
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
    expect(result).toBeTruthy();
  });
});

// ─── Checklist ────────────────────────────────────────────────────────────────
describe("CRM — Checklist Router", () => {
  it("returns empty checklist for a lead", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.checklist.getByLead({ leadId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Meetings ─────────────────────────────────────────────────────────────────
describe("CRM — Meetings Router", () => {
  it("returns empty meetings list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.meetings.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Proposals ────────────────────────────────────────────────────────────────
describe("CRM — Proposals Router", () => {
  it("creates a proposal and returns shareToken", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.proposals.create({
      leadId: 1,
      title: "Proposta Comercial",
      monthlyValue: "299.00",
    });
    expect(result).toHaveProperty("success", true);
    // O campo correto é shareToken (não token)
    expect(result).toHaveProperty("shareToken");
    expect(typeof (result as any).shareToken).toBe("string");
  });

  it("rejects expired proposal via respondByToken", async () => {
    const { getProposalByToken } = await import("./db");
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    vi.mocked(getProposalByToken).mockResolvedValueOnce({
      id: 1,
      status: "pending",
      expiresAt: yesterday,
      leadId: 1,
    } as any);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.proposals.respondByToken({ token: "abc", response: "accepted" })
    ).rejects.toThrow();
  });
});

// ─── Contracts ────────────────────────────────────────────────────────────────
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

  it("rejects cancellation of a signed contract", async () => {
    const { getContracts } = await import("./db");
    vi.mocked(getContracts).mockResolvedValueOnce([
      { id: 99, leadId: 1, status: "signed", shareToken: "tok" } as any,
    ]);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.contracts.cancel({ id: 99, leadId: 1 })
    ).rejects.toThrow("Não é possível cancelar um contrato já assinado");
  });

  it("cancels a draft contract successfully", async () => {
    const { getContracts, updateContract } = await import("./db");
    vi.mocked(getContracts).mockResolvedValueOnce([
      { id: 55, leadId: 1, status: "draft", shareToken: "tok2" } as any,
    ]);
    vi.mocked(updateContract).mockResolvedValueOnce(undefined as any);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.contracts.cancel({ id: 55, leadId: 1 });
    expect(result).toHaveProperty("success", true);
  });
});

// ─── Follow-ups ───────────────────────────────────────────────────────────────
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

  it("creates a manual follow-up", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.followUps.create({
      leadId: 1,
      scheduledAt: new Date().toISOString(),
      attemptNumber: 1,
    });
    expect(result).toHaveProperty("success", true);
  });

  it("marks a follow-up as responded", async () => {
    const { updateFollowUp } = await import("./db");
    vi.mocked(updateFollowUp).mockResolvedValueOnce(undefined as any);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.followUps.markResponded({ id: 1, leadId: 1 });
    expect(result).toHaveProperty("success", true);
  });
});

// ─── Trials ───────────────────────────────────────────────────────────────────
describe("CRM — Trials Router", () => {
  it("creates a trial and advances lead to trial stage", async () => {
    const { updateLead } = await import("./db");
    vi.mocked(updateLead).mockResolvedValueOnce(undefined as any);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.trials.create({ leadId: 1, durationDays: 30 });
    expect(result).toHaveProperty("success", true);
  });

  it("converts a trial and advances lead to active_client", async () => {
    const { updateTrial, updateLead } = await import("./db");
    vi.mocked(updateTrial).mockResolvedValueOnce(undefined as any);
    vi.mocked(updateLead).mockResolvedValueOnce(undefined as any);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.trials.convert({ id: 1, leadId: 1 });
    expect(result).toHaveProperty("success", true);
    expect(vi.mocked(updateLead)).toHaveBeenCalledWith(1, expect.objectContaining({ stage: "active_client" }));
  });

  it("cancels a trial", async () => {
    const { updateTrial } = await import("./db");
    vi.mocked(updateTrial).mockResolvedValueOnce(undefined as any);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.trials.cancel({ id: 1, leadId: 1 });
    expect(result).toHaveProperty("success", true);
  });
});

// ─── Metrics ──────────────────────────────────────────────────────────────────
describe("CRM — Metrics Router", () => {
  it("returns funnel metrics with correct shape", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.metrics.funnel();
    // Validar o shape real retornado por getFunnelMetrics
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("active");
    expect(result).toHaveProperty("converted");
    expect(result).toHaveProperty("lost");
    expect(result).toHaveProperty("conversionRate");
    expect(result).toHaveProperty("totalRevenue");
    expect(result).toHaveProperty("stageGroups");
    expect(result).toHaveProperty("stageConversion");
  });
});

// ─── Referrals ────────────────────────────────────────────────────────────────
describe("CRM — Referrals Router", () => {
  it("returns empty referrals list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.referrals.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a referral", async () => {
    const { getLeadById } = await import("./db");
    vi.mocked(getLeadById).mockResolvedValueOnce({ id: 1, companyName: "Pousada Sol" } as any);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.referrals.create({
      referrerLeadId: 1,
      referredName: "Restaurante Mar",
      referredPhone: "75988887777",
    });
    expect(result).toHaveProperty("success", true);
  });

  it("updates referral status to contacted", async () => {
    const { updateReferral } = await import("./db");
    vi.mocked(updateReferral).mockResolvedValueOnce(undefined as any);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.referrals.update({ id: 1, status: "contacted" });
    expect(result).toHaveProperty("success", true);
  });
});

// ─── LLM ──────────────────────────────────────────────────────────────────────
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
