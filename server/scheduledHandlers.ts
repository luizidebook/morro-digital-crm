import type { Request, Response } from "express";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";
import {
  addInteraction,
  createFollowUp,
  getExpiringTrials,
  getFollowUpSettings,
  getFollowUps,
  getLeadById,
  getLeads,
  getPendingFollowUps,
  updateFollowUp,
  updateLead,
  updateTrial,
} from "./db";

// ─── Follow-up Checker ────────────────────────────────────────────────────────
// Verifica leads sem resposta e gera follow-ups automáticos
export async function followupCheckHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) return res.status(403).json({ error: "cron-only" });

    const settings = await getFollowUpSettings();
    const activeSetting = settings.find((s) => s.isActive);
    if (!activeSetting) return res.json({ ok: true, skipped: "no active settings" });

    // Buscar todos os leads em etapas que precisam de follow-up
    const allLeads = await getLeads({});
    const now = new Date();
    const cutoff = new Date(now.getTime() - activeSetting.intervalDays * 24 * 60 * 60 * 1000);

    const stagesForFollowUp = [
      "new_lead", "first_contact", "meeting_scheduled", "proposal_sent", "trial", "contract_sent",
    ];

    let processed = 0;
    let generated = 0;

    for (const lead of allLeads) {
      if (!stagesForFollowUp.includes(lead.stage)) continue;
      if (lead.status === "lost" || lead.status === "inactive") continue;

      // Verificar se já atingiu o máximo de tentativas
      const existingFollowUps = await getFollowUps(lead.id);
      const attemptCount = existingFollowUps.filter((f) => f.settingId === activeSetting.id).length;
      if (attemptCount >= activeSetting.maxAttempts) continue;

      const lastContact = lead.lastContactAt ? new Date(lead.lastContactAt) : new Date(lead.createdAt);
      if (lastContact > cutoff) continue;

      // Gerar mensagem personalizada via LLM
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um consultor comercial do Morro Digital, plataforma de presença digital para negócios em Morro de São Paulo, Bahia. Escreva mensagens de follow-up para WhatsApp: curtas (máx. 2 parágrafos), calorosas, personalizadas e sem ser insistente.`,
            },
            {
              role: "user",
              content: `Escreva um follow-up automático para:\nEmpresa: ${lead.companyName}\nSegmento: ${lead.segment || "não informado"}\nContato: ${lead.contactName || "não informado"}\nEtapa: ${lead.stage}\nÚltimo contato: ${lastContact.toLocaleDateString("pt-BR")}\n\nSeja breve, caloroso e específico para o segmento desta empresa.`,
            },
          ],
        });
        const rawContent = response.choices[0]?.message?.content;
        const message = typeof rawContent === "string" ? rawContent : "";

        const scheduledAt = new Date();
        await createFollowUp({
          leadId: lead.id,
          settingId: activeSetting.id,
          generatedMessage: message,
          scheduledAt,
          status: "pending",
          attemptNumber: attemptCount + 1,
        });
        generated++;
      } catch (err) {
        console.error(`[FollowUp] Failed to generate for lead ${lead.id}:`, err);
      }
      processed++;
    }

    if (generated > 0) {
      await notifyOwner({
        title: "Follow-ups Automáticos Gerados",
        content: `${generated} mensagens de follow-up foram geradas automaticamente para leads sem resposta. Acesse o CRM para revisar e enviar.`,
      });
    }

    res.json({ ok: true, processed, generated });
  } catch (err: any) {
    console.error("[FollowUp Handler] Error:", err);
    res.status(500).json({ error: err.message, stack: err.stack, timestamp: new Date().toISOString() });
  }
}

// ─── Trial Expiry Checker ─────────────────────────────────────────────────────
// Verifica trials vencendo e notifica o operador
export async function trialExpiryHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) return res.status(403).json({ error: "cron-only" });

    const now = new Date();

    // Trials vencendo em 3 dias
    const expiringSoon = await getExpiringTrials(3);
    for (const trial of expiringSoon) {
      if (trial.notifiedAt) continue; // já notificado
      const lead = await getLeadById(trial.leadId);
      if (!lead) continue;
      await updateTrial(trial.id, { notifiedAt: now });
      await addInteraction({
        leadId: trial.leadId,
        type: "system",
        content: `Trial vence em ${Math.ceil((new Date(trial.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} dias (${new Date(trial.endDate).toLocaleDateString("pt-BR")})`,
      });
    }

    // Trials já vencidos — atualizar status
    const allTrials = await getExpiringTrials(0);
    let expired = 0;
    for (const trial of allTrials) {
      if (new Date(trial.endDate) <= now && trial.status === "active") {
        await updateTrial(trial.id, { status: "expired" });
        const lead = await getLeadById(trial.leadId);
        if (lead) {
          await addInteraction({
            leadId: trial.leadId,
            type: "system",
            content: "Trial expirado. Aguardando conversão ou cancelamento.",
          });
        }
        expired++;
      }
    }

    if (expiringSoon.length > 0 || expired > 0) {
      await notifyOwner({
        title: "Alertas de Trial",
        content: `${expiringSoon.length} trial(s) vencendo em breve. ${expired} trial(s) expirado(s). Acesse o CRM para acompanhar.`,
      });
    }

    res.json({ ok: true, expiringSoon: expiringSoon.length, expired });
  } catch (err: any) {
    console.error("[Trial Expiry Handler] Error:", err);
    res.status(500).json({ error: err.message, stack: err.stack, timestamp: new Date().toISOString() });
  }
}
