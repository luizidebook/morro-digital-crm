// ─── Stage Labels & Colors ────────────────────────────────────────────────────
// IMPORTANTE: Esta lista deve estar em paridade com o enum `leads.stage` em drizzle/schema.ts
// e com FUNNEL_STAGE_ORDER em server/db.ts
export const STAGE_LABELS: Record<string, string> = {
  new_lead: "Novo Lead",
  first_contact: "Primeiro Contato",
  meeting_scheduled: "Reunião Agendada",
  proposal_sent: "Proposta Enviada",
  trial: "Trial",
  contract_sent: "Contrato Enviado",
  contract_signed: "Contrato Assinado",
  payment_pending: "Pagamento Pendente",
  payment_done: "Pagamento Recebido",
  onboarding: "Onboarding",
  photo_visit_scheduled: "Visita Agendada",
  photo_visit_done: "Visita Realizada",
  published: "Publicado",
  announced: "Divulgado",
  feedback: "Feedback",
  active_client: "Cliente Ativo",
  churned: "Cancelado",
  lost: "Perdido",
};

export const STAGE_COLORS: Record<string, string> = {
  new_lead: "bg-slate-800 text-slate-300 border-slate-700",
  first_contact: "bg-blue-950 text-blue-300 border-blue-800",
  meeting_scheduled: "bg-violet-950 text-violet-300 border-violet-800",
  proposal_sent: "bg-amber-950 text-amber-300 border-amber-800",
  trial: "bg-cyan-950 text-cyan-300 border-cyan-800",
  contract_sent: "bg-orange-950 text-orange-300 border-orange-800",
  contract_signed: "bg-emerald-950 text-emerald-300 border-emerald-800",
  payment_pending: "bg-yellow-950 text-yellow-300 border-yellow-800",
  payment_done: "bg-green-950 text-green-300 border-green-800",
  onboarding: "bg-teal-950 text-teal-300 border-teal-800",
  photo_visit_scheduled: "bg-indigo-950 text-indigo-300 border-indigo-800",
  photo_visit_done: "bg-purple-950 text-purple-300 border-purple-800",
  published: "bg-lime-950 text-lime-300 border-lime-800",
  announced: "bg-pink-950 text-pink-300 border-pink-800",
  feedback: "bg-rose-950 text-rose-300 border-rose-800",
  active_client: "bg-teal-950 text-teal-300 border-teal-800",
  churned: "bg-red-950 text-red-300 border-red-800",
  lost: "bg-zinc-900 text-zinc-400 border-zinc-700",
};

// Ordem canônica do funil — deve ser idêntica a FUNNEL_STAGE_ORDER em server/db.ts
export const STAGE_ORDER = [
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
];

// ─── Segment Labels ───────────────────────────────────────────────────────────
export const SEGMENTS = [
  "Pousada / Hotel",
  "Restaurante / Bar",
  "Passeio / Turismo",
  "Comércio",
  "Serviços",
  "Imobiliária",
  "Saúde / Beleza",
  "Educação",
  "Outro",
];

// ─── Interaction Type Labels ──────────────────────────────────────────────────
export const INTERACTION_LABELS: Record<string, string> = {
  note: "Nota",
  whatsapp: "WhatsApp",
  call: "Ligação",
  email: "E-mail",
  meeting: "Reunião",
  stage_change: "Mudança de Etapa",
  proposal: "Proposta",
  contract: "Contrato",
  payment: "Pagamento",
  follow_up: "Follow-up",
  system: "Sistema",
};

export const INTERACTION_ICONS: Record<string, string> = {
  note: "📝",
  whatsapp: "💬",
  call: "📞",
  email: "📧",
  meeting: "🤝",
  stage_change: "🔄",
  proposal: "📋",
  contract: "✍️",
  payment: "💰",
  follow_up: "🔔",
  system: "⚙️",
};

// ─── Checklist Step Labels ────────────────────────────────────────────────────
export const CHECKLIST_LABELS: Record<string, { label: string; description: string }> = {
  first_contact: { label: "Primeiro Contato", description: "Mensagem inicial enviada via WhatsApp" },
  meeting_scheduled: { label: "Reunião Agendada", description: "Reunião presencial ou online marcada" },
  meeting_done: { label: "Reunião Realizada", description: "Apresentação do projeto concluída" },
  proposal_sent: { label: "Proposta Enviada", description: "Proposta personalizada enviada ao cliente" },
  proposal_accepted: { label: "Proposta Aceita", description: "Cliente aceitou os termos da proposta" },
  trial_started: { label: "Trial Iniciado", description: "Período de teste ativado para o cliente" },
  contract_drafted: { label: "Contrato Redigido", description: "Contrato elaborado com dados do cliente" },
  contract_sent: { label: "Contrato Enviado", description: "Contrato enviado para assinatura" },
  contract_signed: { label: "Contrato Assinado", description: "Contrato assinado pelo cliente" },
  payment_received: { label: "Pagamento Recebido", description: "Primeiro pagamento confirmado" },
  data_collected: { label: "Dados Coletados", description: "Informações da empresa coletadas para o site" },
  photo_visit_scheduled: { label: "Visita Fotográfica Agendada", description: "Data da visita para fotos marcada" },
  photo_visit_done: { label: "Visita Fotográfica Realizada", description: "Fotos do local produzidas" },
  site_updated: { label: "Site Atualizado", description: "Página da empresa publicada no site" },
  announced: { label: "Parceria Divulgada", description: "Nova parceria anunciada nas redes sociais" },
  feedback_collected: { label: "Feedback Coletado", description: "Avaliação do cliente registrada" },
};

// ─── Formatters ───────────────────────────────────────────────────────────────
export function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return formatDate(date);
}

export function getWhatsAppLink(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  const encoded = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${encoded}`;
}
