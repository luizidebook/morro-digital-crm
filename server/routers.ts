import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  CHECKLIST_STEPS,
  addInteraction,
  createContract,
  createFollowUp,
  createLead,
  createMeeting,
  createProposal,
  createReferral,
  createTrial,
  deleteLead,
  getChecklistByLead,
  getContractByToken,
  getContracts,
  getFollowUpSettings,
  getFollowUps,
  getFunnelMetrics,
  getInteractions,
  getLeadById,
  getLeads,
  getMeetings,
  getPendingFollowUps,
  getProposalByToken,
  getProposals,
  getReferrals,
  getTrials,
  initializeChecklist,
  toggleChecklistItem,
  updateContract,
  updateFollowUp,
  upsertFollowUpSetting,
  updateLead,
  updateMeeting,
  updateProposal,
  updateReferral,
  updateTrial,
} from "./db";

// ─── Leads Router ─────────────────────────────────────────────────────────────
const leadsRouter = router({
  list: protectedProcedure
    .input(z.object({ stage: z.string().optional(), status: z.string().optional(), search: z.string().optional() }).optional())
    .query(({ input }) => getLeads(input)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const lead = await getLeadById(input.id);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
      return lead;
    }),

  create: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1),
      segment: z.string().optional(),
      contactName: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      address: z.string().optional(),
      website: z.string().optional(),
      notes: z.string().optional(),
      source: z.string().optional(),
      monthlyValue: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await createLead({
        ...input,
        monthlyValue: input.monthlyValue ? input.monthlyValue as any : undefined,
        assignedToId: ctx.user.id,
      });
      await addInteraction({
        leadId: 0, // will be set after insert
        type: "system",
        content: `Lead ${input.companyName} cadastrado no sistema`,
        createdById: ctx.user.id,
      });
      const leads = await getLeads({ search: input.companyName });
      const newLead = leads[0];
      if (newLead) {
        await initializeChecklist(newLead.id);
        await addInteraction({
          leadId: newLead.id,
          type: "system",
          content: `Lead cadastrado no sistema`,
          createdById: ctx.user.id,
        });
      }
      return newLead;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      companyName: z.string().min(1).optional(),
      segment: z.string().optional(),
      contactName: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      website: z.string().optional(),
      notes: z.string().optional(),
      source: z.string().optional(),
      monthlyValue: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await updateLead(id, { ...data, monthlyValue: data.monthlyValue as any });
      return { success: true };
    }),

  updateStage: protectedProcedure
    .input(z.object({ id: z.number(), stage: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const lead = await getLeadById(input.id);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      await updateLead(input.id, { stage: input.stage as any, lastContactAt: new Date() });
      await addInteraction({
        leadId: input.id,
        type: "stage_change",
        content: `Etapa alterada de "${lead.stage}" para "${input.stage}"`,
        metadata: { from: lead.stage, to: input.stage },
        createdById: ctx.user.id,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteLead(input.id);
      return { success: true };
    }),

  // Rota pública: recebe leads gerados pelo Onboarding da Plataforma Principal
  inboundFromPlatform: publicProcedure
    .input(z.object({
      companyName: z.string().min(1),
      contactName: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      segment: z.string().optional(),
      planName: z.string().optional(),
      monthlyValue: z.string().optional(),
      source: z.string().optional(),
      notes: z.string().optional(),
      // Chave de segurança simples para evitar spam
      apiKey: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Verificar chave de API (configurar via variável de ambiente)
      const expectedKey = process.env.PLATFORM_INBOUND_API_KEY;
      if (expectedKey && input.apiKey !== expectedKey) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Chave de API inválida" });
      }

      // Verificar se já existe lead com mesmo nome de empresa
      const existing = await getLeads({ search: input.companyName });
      const duplicate = existing.find(
        (l) => l.companyName.toLowerCase().trim() === input.companyName.toLowerCase().trim()
      );
      if (duplicate) {
        // Atualizar interação no lead existente em vez de duplicar
        await addInteraction({
          leadId: duplicate.id,
          type: "system",
          content: `Lead retornou ao onboarding da plataforma${input.planName ? ` — plano de interesse: ${input.planName}` : ""}`,
          createdById: 0,
        });
        return { success: true, leadId: duplicate.id, duplicate: true };
      }

      await createLead({
        companyName: input.companyName,
        contactName: input.contactName,
        whatsapp: input.whatsapp,
        email: input.email,
        segment: input.segment,
        monthlyValue: input.monthlyValue as any,
        source: input.source || "Plataforma Morro Digital (Onboarding)",
        notes: input.notes || (input.planName ? `Plano de interesse: ${input.planName}` : undefined),
        stage: "new_lead" as any,
      });

      const leads = await getLeads({ search: input.companyName });
      const newLead = leads[0];
      if (newLead) {
        await initializeChecklist(newLead.id);
        await addInteraction({
          leadId: newLead.id,
          type: "system",
          content: `Lead criado automaticamente via Onboarding da Plataforma${input.planName ? ` — plano de interesse: ${input.planName}` : ""}`,
          createdById: 0,
        });
        return { success: true, leadId: newLead.id, duplicate: false };
      }
      return { success: true, leadId: null, duplicate: false };
    }),
});

// ─── Checklist Router ─────────────────────────────────────────────────────────
const checklistRouter = router({
  getByLead: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const items = await getChecklistByLead(input.leadId);
      return CHECKLIST_STEPS.map((step) => {
        const item = items.find((i) => i.step === step.step);
        return { ...step, id: item?.id, completed: item?.completed ?? false, completedAt: item?.completedAt, notes: item?.notes };
      });
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.number(), completed: z.boolean(), leadId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await toggleChecklistItem(input.id, input.completed, ctx.user.id);
      const step = CHECKLIST_STEPS.find((s) => {
        return true; // will be resolved by step label
      });
      await addInteraction({
        leadId: input.leadId,
        type: "system",
        content: `Checklist: etapa ${input.completed ? "concluída" : "desmarcada"}`,
        createdById: ctx.user.id,
      });
      return { success: true };
    }),

  steps: publicProcedure.query(() => CHECKLIST_STEPS),
});

// ─── Meetings Router ──────────────────────────────────────────────────────────
const meetingsRouter = router({
  list: protectedProcedure
    .input(z.object({ leadId: z.number().optional() }).optional())
    .query(({ input }) => getMeetings(input?.leadId)),

  create: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      title: z.string().min(1),
      scheduledAt: z.string(),
      modality: z.enum(["in_person", "online"]),
      meetingLink: z.string().optional(),
      location: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await createMeeting({ ...input, scheduledAt: new Date(input.scheduledAt), createdById: ctx.user.id });
      await addInteraction({
        leadId: input.leadId,
        type: "meeting",
        content: `Reunião "${input.title}" agendada para ${new Date(input.scheduledAt).toLocaleString("pt-BR")} (${input.modality === "online" ? "Online" : "Presencial"})`,
        createdById: ctx.user.id,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      scheduledAt: z.string().optional(),
      modality: z.enum(["in_person", "online"]).optional(),
      meetingLink: z.string().optional(),
      location: z.string().optional(),
      status: z.enum(["scheduled", "done", "cancelled", "no_show"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, scheduledAt, ...rest } = input;
      await updateMeeting(id, { ...rest, ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}) });
      return { success: true };
    }),
});

// ─── Proposals Router ─────────────────────────────────────────────────────────
const proposalsRouter = router({
  list: protectedProcedure
    .input(z.object({ leadId: z.number().optional() }).optional())
    .query(({ input }) => getProposals(input?.leadId)),

  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const proposal = await getProposalByToken(input.token);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });
      if (proposal.status === "sent") await updateProposal(proposal.id, { status: "viewed", viewedAt: new Date() });
      return proposal;
    }),

  create: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      title: z.string().min(1),
      planName: z.string().optional(),
      monthlyValue: z.string(),
      setupFee: z.string().optional(),
      trialDays: z.number().optional(),
      features: z.array(z.string()).optional(),
      customMessage: z.string().optional(),
      validUntil: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const token = nanoid(32);
      await createProposal({
        ...input,
        monthlyValue: input.monthlyValue as any,
        setupFee: input.setupFee as any,
        features: input.features ? JSON.stringify(input.features) as any : undefined,
        validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
        shareToken: token,
        createdById: ctx.user.id,
      });
      await addInteraction({
        leadId: input.leadId,
        type: "proposal",
        content: `Proposta "${input.title}" criada — R$ ${input.monthlyValue}/mês`,
        createdById: ctx.user.id,
      });
      return { success: true, token };
    }),

  send: protectedProcedure
    .input(z.object({ id: z.number(), leadId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await updateProposal(input.id, { status: "sent", sentAt: new Date() });
      await addInteraction({
        leadId: input.leadId,
        type: "proposal",
        content: "Proposta enviada ao cliente",
        createdById: ctx.user.id,
      });
      return { success: true };
    }),

  respond: protectedProcedure
    .input(z.object({ id: z.number(), leadId: z.number(), accepted: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await updateProposal(input.id, { status: input.accepted ? "accepted" : "rejected", respondedAt: new Date() });
      if (input.accepted) {
        await updateLead(input.leadId, { stage: "contract_sent" });
      }
      await addInteraction({
        leadId: input.leadId,
        type: "proposal",
        content: `Proposta ${input.accepted ? "aceita" : "recusada"} pelo cliente`,
        createdById: ctx.user.id,
      });
      return { success: true };
    }),

  // Rota pública: cliente aceita/recusa proposta via link compartilhado
  respondByToken: publicProcedure
    .input(z.object({ token: z.string(), accepted: z.boolean(), respondentName: z.string().optional() }))
    .mutation(async ({ input }) => {
      const proposal = await getProposalByToken(input.token);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND", message: "Proposta não encontrada" });
      if (proposal.status === "accepted" || proposal.status === "rejected") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta proposta já foi respondida" });
      }
      await updateProposal(proposal.id, {
        status: input.accepted ? "accepted" : "rejected",
        respondedAt: new Date(),
      });
      if (input.accepted) {
        await updateLead(proposal.leadId, { stage: "contract_sent" });
      }
      await addInteraction({
        leadId: proposal.leadId,
        type: "proposal",
        content: `Proposta ${input.accepted ? "aceita" : "recusada"} pelo cliente${input.respondentName ? ` (${input.respondentName})` : ""} via link público`,
        createdById: 0,
      });
      return { success: true, accepted: input.accepted };
    }),
});

// ─── Contracts Router ─────────────────────────────────────────────────────────
const contractsRouter = router({
  list: protectedProcedure
    .input(z.object({ leadId: z.number().optional() }).optional())
    .query(({ input }) => getContracts(input?.leadId)),

  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const contract = await getContractByToken(input.token);
      if (!contract) throw new TRPCError({ code: "NOT_FOUND" });
      return contract;
    }),

  create: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      proposalId: z.number().optional(),
      title: z.string().min(1),
      content: z.string().min(1),
      monthlyValue: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const token = nanoid(32);
      await createContract({ ...input, monthlyValue: input.monthlyValue as any, shareToken: token, createdById: ctx.user.id });
      await addInteraction({
        leadId: input.leadId,
        type: "contract",
        content: `Contrato "${input.title}" redigido`,
        createdById: ctx.user.id,
      });
      return { success: true, token };
    }),

  send: protectedProcedure
    .input(z.object({ id: z.number(), leadId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await updateContract(input.id, { status: "sent", sentAt: new Date() });
      await addInteraction({ leadId: input.leadId, type: "contract", content: "Contrato enviado para assinatura", createdById: ctx.user.id });
      return { success: true };
    }),

  sign: protectedProcedure
    .input(z.object({ id: z.number(), leadId: z.number(), signatureData: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      await updateContract(input.id, { status: "signed", signedAt: new Date(), signatureData: input.signatureData });
      await updateLead(input.leadId, { stage: "contract_signed" });
      await addInteraction({ leadId: input.leadId, type: "contract", content: "Contrato assinado pelo cliente (via painel)", createdById: ctx.user.id });
      return { success: true };
    }),

  // Rota pública: cliente assina o contrato via link compartilhado
  signByToken: publicProcedure
    .input(z.object({
      token: z.string(),
      signatureData: z.string().min(1),
      signerName: z.string().min(1),
      signerIp: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const contract = await getContractByToken(input.token);
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contrato não encontrado" });
      if (contract.status === "signed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este contrato já foi assinado" });
      }
      if (contract.status === "cancelled") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este contrato foi cancelado" });
      }
      const signerIp = input.signerIp || (ctx.req.headers["x-forwarded-for"] as string) || "desconhecido";
      await updateContract(contract.id, {
        status: "signed",
        signedAt: new Date(),
        signatureData: input.signatureData,
        signerName: input.signerName,
        signerIp,
      });
      await updateLead(contract.leadId, { stage: "contract_signed" });
      await addInteraction({
        leadId: contract.leadId,
        type: "contract",
        content: `Contrato assinado digitalmente por ${input.signerName} (IP: ${signerIp}) via link público`,
        createdById: 0,
      });
      return { success: true, signedAt: new Date().toISOString() };
    }),

  generateContent: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ input }) => {
      const lead = await getLeadById(input.leadId);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Você é um assistente jurídico especializado em contratos de serviços digitais para o turismo em Morro de São Paulo, Bahia. Redija contratos profissionais, claros e completos em português brasileiro." },
          { role: "user", content: `Redija um contrato de prestação de serviços digitais para a empresa "${lead.companyName}" (segmento: ${lead.segment || "não informado"}, contato: ${lead.contactName || "não informado"}). O contrato deve incluir: identificação das partes, objeto do contrato (presença digital no site Morro Digital), obrigações de ambas as partes, valor mensal${lead.monthlyValue ? ` de R$ ${lead.monthlyValue}` : ""}, prazo de vigência de 12 meses com renovação automática, condições de rescisão, e foro de Cairu/BA. Formato profissional com cláusulas numeradas.` },
        ],
      });
      return { content: response.choices[0]?.message?.content || "" };
    }),
});

// ─── Interactions Router ──────────────────────────────────────────────────────
const interactionsRouter = router({
  list: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(({ input }) => getInteractions(input.leadId)),

  add: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      type: z.enum(["note", "whatsapp", "call", "email", "meeting", "stage_change", "proposal", "contract", "payment", "follow_up", "system"]),
      content: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      await addInteraction({ ...input, createdById: ctx.user.id });
      await updateLead(input.leadId, { lastContactAt: new Date() });
      return { success: true };
    }),
});

// ─── Follow-ups Router ────────────────────────────────────────────────────────
const followUpsRouter = router({
  settings: protectedProcedure.query(() => getFollowUpSettings()),

  saveSetting: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().min(1),
      intervalDays: z.number().min(1),
      maxAttempts: z.number().min(1),
      messageTemplate: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      await upsertFollowUpSetting(input as any);
      return { success: true };
    }),

  list: protectedProcedure
    .input(z.object({ leadId: z.number().optional() }).optional())
    .query(({ input }) => getFollowUps(input?.leadId)),

  pending: protectedProcedure.query(() => getPendingFollowUps()),

  create: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      settingId: z.number().optional(),
      scheduledAt: z.string(),
      attemptNumber: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await createFollowUp({ ...input, scheduledAt: new Date(input.scheduledAt) });
      return { success: true };
    }),

  markSent: protectedProcedure
    .input(z.object({ id: z.number(), leadId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await updateFollowUp(input.id, { status: "sent", sentAt: new Date() });
      await addInteraction({ leadId: input.leadId, type: "follow_up", content: "Follow-up enviado via WhatsApp", createdById: ctx.user.id });
      await updateLead(input.leadId, { lastContactAt: new Date() });
      return { success: true };
    }),

  markResponded: protectedProcedure
    .input(z.object({ id: z.number(), leadId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await updateFollowUp(input.id, { status: "responded", respondedAt: new Date() });
      await addInteraction({ leadId: input.leadId, type: "follow_up", content: "Lead respondeu ao follow-up", createdById: ctx.user.id });
      return { success: true };
    }),

  generateMessage: protectedProcedure
    .input(z.object({ leadId: z.number(), followUpId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const lead = await getLeadById(input.leadId);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      const recentInteractions = await getInteractions(input.leadId);
      const lastInteractions = recentInteractions.slice(0, 5).map((i) => `- ${i.type}: ${i.content}`).join("\n");
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é um consultor comercial do Morro Digital, plataforma de presença digital para negócios em Morro de São Paulo, Bahia. Escreva mensagens de follow-up para WhatsApp: curtas (máx. 3 parágrafos), calorosas, personalizadas, sem ser insistente. Use o nome do contato e da empresa. Nunca use mensagens genéricas.`,
          },
          {
            role: "user",
            content: `Escreva uma mensagem de follow-up para:\n\nEmpresa: ${lead.companyName}\nSegmento: ${lead.segment || "não informado"}\nContato: ${lead.contactName || "não informado"}\nEtapa atual: ${lead.stage}\nÚltimas interações:\n${lastInteractions || "Nenhuma interação registrada"}\n\nA mensagem deve ser adequada para a etapa atual do funil e personalizada para o perfil desta empresa.`,
          },
        ],
      });
      const rawMsg = response.choices[0]?.message?.content;
      const message = typeof rawMsg === "string" ? rawMsg : "";
      if (input.followUpId) await updateFollowUp(input.followUpId, { generatedMessage: message });
      return { message };
    }),
});

// ─── Trials Router ────────────────────────────────────────────────────────────
const trialsRouter = router({
  list: protectedProcedure
    .input(z.object({ leadId: z.number().optional() }).optional())
    .query(({ input }) => getTrials(input?.leadId)),

  create: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      durationDays: z.number().min(1).default(30),
      startDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const start = input.startDate ? new Date(input.startDate) : new Date();
      const end = new Date(start.getTime() + input.durationDays * 24 * 60 * 60 * 1000);
      await createTrial({ leadId: input.leadId, startDate: start, endDate: end, durationDays: input.durationDays });
      await updateLead(input.leadId, { stage: "trial" });
      await addInteraction({ leadId: input.leadId, type: "system", content: `Trial de ${input.durationDays} dias iniciado. Vence em ${end.toLocaleDateString("pt-BR")}`, createdById: ctx.user.id });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "expired", "converted", "cancelled"]).optional(),
      leadId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, leadId, ...data } = input;
      await updateTrial(id, { ...data, ...(data.status === "converted" ? { convertedAt: new Date() } : {}) });
      if (data.status === "converted") {
        await updateLead(leadId, { stage: "active_client", convertedAt: new Date() });
        await addInteraction({ leadId, type: "system", content: "Trial convertido — cliente ativo!", createdById: ctx.user.id });
      }
      return { success: true };
    }),
});

// ─── Referrals Router ─────────────────────────────────────────────────────────
const referralsRouter = router({
  list: protectedProcedure
    .input(z.object({ referrerLeadId: z.number().optional() }).optional())
    .query(({ input }) => getReferrals(input?.referrerLeadId)),

  create: protectedProcedure
    .input(z.object({
      referrerLeadId: z.number(),
      referredName: z.string().min(1),
      referredPhone: z.string().optional(),
      referredEmail: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await createReferral(input);
      const referrer = await getLeadById(input.referrerLeadId);
      await addInteraction({
        leadId: input.referrerLeadId,
        type: "system",
        content: `Indicação registrada: ${input.referredName}`,
        createdById: ctx.user.id,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "contacted", "converted", "lost"]).optional(),
      benefitDescription: z.string().optional(),
      benefitGrantedAt: z.string().optional(),
      referredLeadId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, benefitGrantedAt, ...rest } = input;
      await updateReferral(id, { ...rest, ...(benefitGrantedAt ? { benefitGrantedAt: new Date(benefitGrantedAt) } : {}) });
      return { success: true };
    }),
});

// ─── Metrics Router ───────────────────────────────────────────────────────────
const metricsRouter = router({
  funnel: protectedProcedure.query(() => getFunnelMetrics()),
});

// ─── LLM Router ───────────────────────────────────────────────────────────────
const llmRouter = router({
  generateProposalMessage: protectedProcedure
    .input(z.object({ leadId: z.number(), planName: z.string().optional(), monthlyValue: z.string().optional() }))
    .mutation(async ({ input }) => {
      const lead = await getLeadById(input.leadId);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Você é um consultor comercial do Morro Digital. Escreva mensagens de apresentação de proposta para WhatsApp: profissionais, personalizadas e convincentes. Destaque os benefícios específicos para o tipo de negócio do cliente." },
          { role: "user", content: `Escreva uma mensagem de apresentação de proposta para:\nEmpresa: ${lead.companyName}\nSegmento: ${lead.segment || "não informado"}\nContato: ${lead.contactName || "não informado"}\nPlano: ${input.planName || "Morro Digital"}\nValor: R$ ${input.monthlyValue || "a definir"}/mês\n\nA mensagem deve ser enviada via WhatsApp antes da reunião.` },
        ],
      });
      const content = response.choices[0]?.message?.content;
      return { message: typeof content === "string" ? content : "" };
    }),

  generateAnnouncement: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ input }) => {
      const lead = await getLeadById(input.leadId);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Você é o gerente de marketing do Morro Digital. Escreva posts de divulgação de novas parcerias para Instagram e WhatsApp: animados, informativos e que gerem engajamento." },
          { role: "user", content: `Escreva um post de divulgação de nova parceria para:\nEmpresa: ${lead.companyName}\nSegmento: ${lead.segment || "não informado"}\nEndereço: ${lead.address || "Morro de São Paulo"}\n\nCrie versões para Instagram (com hashtags) e WhatsApp (mais direto).` },
        ],
      });
      const announcementContent = response.choices[0]?.message?.content;
      return { message: typeof announcementContent === "string" ? announcementContent : "" };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  leads: leadsRouter,
  checklist: checklistRouter,
  meetings: meetingsRouter,
  proposals: proposalsRouter,
  contracts: contractsRouter,
  interactions: interactionsRouter,
  followUps: followUpsRouter,
  trials: trialsRouter,
  referrals: referralsRouter,
  metrics: metricsRouter,
  llm: llmRouter,
});

export type AppRouter = typeof appRouter;
