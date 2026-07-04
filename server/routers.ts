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
  getContractById,
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
  getProposalById,
  getProposalByToken,
  getProposals,
  getReferrals,
  getTrials,
  initializeChecklist,
  toggleChecklistItem,
  updateContract,
  updateFollowUp,
  updateLead,
  updateMeeting,
  updateProposal,
  updateReferral,
  updateTrial,
  upsertFollowUpSetting,
} from "./db";
import { InternalSignatureProvider, buildContractContentFromProposal } from "./signature";

const leadsRouter = router({
  list: protectedProcedure.input(z.object({ stage: z.string().optional(), status: z.string().optional(), search: z.string().optional() }).optional()).query(({ input }) => getLeads(input)),
  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const lead = await getLeadById(input.id);
    if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
    return lead;
  }),
  create: protectedProcedure.input(z.object({ companyName: z.string().min(1), segment: z.string().optional(), contactName: z.string().optional(), phone: z.string().optional(), whatsapp: z.string().optional(), email: z.string().optional(), address: z.string().optional(), website: z.string().optional(), notes: z.string().optional(), source: z.string().optional(), monthlyValue: z.string().optional() })).mutation(async ({ input, ctx }) => {
    await createLead({ ...input, monthlyValue: input.monthlyValue as any, assignedToId: ctx.user.id });
    const found = await getLeads({ search: input.companyName });
    const lead = found[0];
    if (lead) {
      await initializeChecklist(lead.id);
      await addInteraction({ leadId: lead.id, type: "system", content: "Lead cadastrado no sistema", createdById: ctx.user.id });
    }
    return lead;
  }),
  update: protectedProcedure.input(z.object({ id: z.number(), companyName: z.string().optional(), segment: z.string().optional(), contactName: z.string().optional(), phone: z.string().optional(), whatsapp: z.string().optional(), email: z.string().optional(), address: z.string().optional(), website: z.string().optional(), notes: z.string().optional(), source: z.string().optional(), monthlyValue: z.string().optional() })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateLead(id, { ...data, monthlyValue: data.monthlyValue as any });
    return { success: true };
  }),
  updateStage: protectedProcedure.input(z.object({ id: z.number(), stage: z.string() })).mutation(async ({ input, ctx }) => {
    const lead = await getLeadById(input.id);
    if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
    await updateLead(input.id, { stage: input.stage as any, lastContactAt: new Date() });
    await addInteraction({ leadId: input.id, type: "stage_change", content: `Etapa alterada de "${lead.stage}" para "${input.stage}"`, metadata: { from: lead.stage, to: input.stage }, createdById: ctx.user.id });
    return { success: true };
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await deleteLead(input.id); return { success: true }; }),
});

const checklistRouter = router({
  getByLead: protectedProcedure.input(z.object({ leadId: z.number() })).query(async ({ input }) => {
    const items = await getChecklistByLead(input.leadId);
    return CHECKLIST_STEPS.map((step) => {
      const item = items.find((i) => i.step === step.step);
      return { ...step, id: item?.id, completed: item?.completed ?? false, completedAt: item?.completedAt, notes: item?.notes };
    });
  }),
  toggle: protectedProcedure.input(z.object({ id: z.number(), completed: z.boolean(), leadId: z.number() })).mutation(async ({ input, ctx }) => {
    await toggleChecklistItem(input.id, input.completed, ctx.user.id);
    await addInteraction({ leadId: input.leadId, type: "system", content: `Checklist: etapa ${input.completed ? "concluida" : "desmarcada"}`, createdById: ctx.user.id });
    return { success: true };
  }),
  steps: publicProcedure.query(() => CHECKLIST_STEPS),
});

const proposalsRouter = router({
  list: protectedProcedure.input(z.object({ leadId: z.number().optional() }).optional()).query(({ input }) => getProposals(input?.leadId)),
  getByToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
    const proposal = await getProposalByToken(input.token);
    if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });
    if (proposal.status === "sent") await updateProposal(proposal.id, { status: "viewed", viewedAt: new Date() });
    return proposal;
  }),
  create: protectedProcedure.input(z.object({ leadId: z.number(), title: z.string().min(1), planName: z.string().optional(), monthlyValue: z.string(), setupFee: z.string().optional(), trialDays: z.number().optional(), features: z.array(z.string()).optional(), customMessage: z.string().optional() })).mutation(async ({ input, ctx }) => {
    const token = nanoid(32);
    await createProposal({ ...input, monthlyValue: input.monthlyValue as any, setupFee: input.setupFee as any, features: input.features ? JSON.stringify(input.features) as any : undefined, shareToken: token, createdById: ctx.user.id });
    await addInteraction({ leadId: input.leadId, type: "proposal", content: `Proposta "${input.title}" criada`, createdById: ctx.user.id });
    return { success: true, token };
  }),
  send: protectedProcedure.input(z.object({ id: z.number(), leadId: z.number() })).mutation(async ({ input, ctx }) => {
    await updateProposal(input.id, { status: "sent", sentAt: new Date() });
    await addInteraction({ leadId: input.leadId, type: "proposal", content: "Proposta enviada ao cliente", createdById: ctx.user.id });
    return { success: true };
  }),
  respond: protectedProcedure.input(z.object({ id: z.number(), leadId: z.number(), accepted: z.boolean() })).mutation(async ({ input, ctx }) => {
    await updateProposal(input.id, { status: input.accepted ? "accepted" : "rejected", respondedAt: new Date() });
    await addInteraction({ leadId: input.leadId, type: "proposal", content: input.accepted ? "Proposta aceita" : "Proposta recusada", createdById: ctx.user.id });
    if (input.accepted) await updateLead(input.leadId, { stage: "contract_sent" as any });
    return { success: true };
  }),
});

async function createContractFromProposal(proposalId: number, userId: number) {
  const proposal = await getProposalById(proposalId);
  if (!proposal) throw new TRPCError({ code: "NOT_FOUND", message: "Proposta nao encontrada" });
  if (proposal.status !== "accepted") throw new TRPCError({ code: "BAD_REQUEST", message: "A proposta precisa estar aceita" });
  const lead = await getLeadById(proposal.leadId);
  if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead nao encontrado" });
  const content = buildContractContentFromProposal({ lead, proposal });
  const shareToken = nanoid(32);
  await createContract({ leadId: lead.id, proposalId: proposal.id, title: `Contrato Morro Digital - ${lead.companyName}`, content, monthlyValue: proposal.monthlyValue as any, shareToken, status: "draft", createdById: userId });
  const created = (await getContracts(lead.id)).find((contract) => contract.shareToken === shareToken);
  if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Contrato nao criado" });
  const provider = new InternalSignatureProvider();
  const doc = await provider.createDocument({ contractId: created.id, contractToken: shareToken, title: created.title, content, signer: { name: lead.contactName, email: lead.email, phone: lead.whatsapp || lead.phone }, metadata: { leadId: lead.id, proposalId: proposal.id } });
  await updateContract(created.id, { provider: doc.provider, providerDocumentId: doc.providerDocumentId, providerSignerId: doc.providerSignerId, signingUrl: doc.signingUrl, externalSignatureStatus: doc.status, signaturePayload: doc.rawResponse as any, status: "waiting_signature", sentAt: new Date() });
  await updateLead(lead.id, { stage: "contract_sent" as any });
  await addInteraction({ leadId: lead.id, type: "contract", content: "Contrato digital gerado", metadata: { contractId: created.id, signingUrl: doc.signingUrl }, createdById: userId });
  return { contractId: created.id, signingUrl: doc.signingUrl, reused: false };
}

const contractsRouter = router({
  list: protectedProcedure.input(z.object({ leadId: z.number().optional() }).optional()).query(({ input }) => getContracts(input?.leadId)),
  getByToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
    const contract = await getContractByToken(input.token);
    if (!contract) throw new TRPCError({ code: "NOT_FOUND" });
    if (["sent", "waiting_signature"].includes(contract.status)) await updateContract(contract.id, { status: "viewed", viewedAt: new Date() });
    return contract;
  }),
  create: protectedProcedure.input(z.object({ leadId: z.number(), title: z.string().min(1), content: z.string().min(1), monthlyValue: z.string().optional() })).mutation(async ({ input, ctx }) => {
    const shareToken = nanoid(32);
    await createContract({ ...input, monthlyValue: input.monthlyValue as any, shareToken, createdById: ctx.user.id, status: "draft" });
    await addInteraction({ leadId: input.leadId, type: "contract", content: `Contrato "${input.title}" criado`, createdById: ctx.user.id });
    return { success: true, shareToken };
  }),
  send: protectedProcedure.input(z.object({ id: z.number(), leadId: z.number() })).mutation(async ({ input, ctx }) => {
    const contract = await getContractById(input.id);
    if (!contract) throw new TRPCError({ code: "NOT_FOUND" });
    const shareToken = contract.shareToken || nanoid(32);
    const provider = new InternalSignatureProvider();
    const doc = await provider.createDocument({ contractId: contract.id, contractToken: shareToken, title: contract.title, content: contract.content, signer: {}, metadata: { leadId: input.leadId } });
    await updateContract(input.id, { shareToken, status: "waiting_signature", sentAt: new Date(), provider: doc.provider, providerDocumentId: doc.providerDocumentId, providerSignerId: doc.providerSignerId, signingUrl: doc.signingUrl, externalSignatureStatus: doc.status, signaturePayload: doc.rawResponse as any });
    await updateLead(input.leadId, { stage: "contract_sent" as any });
    await addInteraction({ leadId: input.leadId, type: "contract", content: "Contrato enviado para assinatura digital", createdById: ctx.user.id });
    return { success: true, signingUrl: doc.signingUrl };
  }),
  sign: protectedProcedure.input(z.object({ id: z.number(), leadId: z.number() })).mutation(async ({ input, ctx }) => {
    await updateContract(input.id, { status: "signed", signedAt: new Date(), externalSignatureStatus: "signed" });
    await updateLead(input.leadId, { stage: "contract_signed" as any });
    await addInteraction({ leadId: input.leadId, type: "contract", content: "Contrato assinado", createdById: ctx.user.id });
    return { success: true };
  }),
  publicSign: publicProcedure.input(z.object({ token: z.string(), signerName: z.string().min(2), acceptedTerms: z.boolean() })).mutation(async ({ input }) => {
    if (!input.acceptedTerms) throw new TRPCError({ code: "BAD_REQUEST", message: "Aceite obrigatorio" });
    const contract = await getContractByToken(input.token);
    if (!contract) throw new TRPCError({ code: "NOT_FOUND" });
    if (contract.status === "signed") return { success: true, alreadySigned: true };
    const payload = { signerName: input.signerName, acceptedTerms: true, signedAt: new Date().toISOString() };
    await updateContract(contract.id, { status: "signed", signedAt: new Date(), externalSignatureStatus: "signed", signatureData: JSON.stringify(payload), signaturePayload: payload as any });
    await updateLead(contract.leadId, { stage: "contract_signed" as any });
    await addInteraction({ leadId: contract.leadId, type: "contract", content: `Contrato assinado digitalmente por ${input.signerName}`, metadata: payload });
    return { success: true };
  }),
  generateDigitalFromProposal: protectedProcedure.input(z.object({ proposalId: z.number() })).mutation(async ({ input, ctx }) => createContractFromProposal(input.proposalId, ctx.user.id)),
});

const meetingsRouter = router({ list: protectedProcedure.input(z.object({ leadId: z.number().optional() }).optional()).query(({ input }) => getMeetings(input?.leadId)) });
const interactionsRouter = router({ list: protectedProcedure.input(z.object({ leadId: z.number() })).query(({ input }) => getInteractions(input.leadId)) });
const followUpsRouter = router({ settings: protectedProcedure.query(() => getFollowUpSettings()), list: protectedProcedure.input(z.object({ leadId: z.number().optional() }).optional()).query(({ input }) => getFollowUps(input?.leadId)), pending: protectedProcedure.query(() => getPendingFollowUps()) });
const trialsRouter = router({ list: protectedProcedure.input(z.object({ leadId: z.number().optional() }).optional()).query(({ input }) => getTrials(input?.leadId)) });
const referralsRouter = router({ list: protectedProcedure.input(z.object({ referrerLeadId: z.number().optional() }).optional()).query(({ input }) => getReferrals(input?.referrerLeadId)) });
const metricsRouter = router({ funnel: protectedProcedure.query(() => getFunnelMetrics()) });
const llmRouter = router({
  generateProposalMessage: protectedProcedure.input(z.object({ leadId: z.number(), planName: z.string().optional(), monthlyValue: z.string().optional() })).mutation(async ({ input }) => {
    const lead = await getLeadById(input.leadId);
    if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
    const response = await invokeLLM({ messages: [{ role: "system", content: "Escreva mensagens comerciais curtas para WhatsApp." }, { role: "user", content: `Empresa: ${lead.companyName}. Plano: ${input.planName || "Morro Digital"}. Valor: ${input.monthlyValue || "a definir"}.` }] });
    const content = response.choices[0]?.message?.content;
    return { message: typeof content === "string" ? content : "" };
  }),
});

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
