# Morro Digital CRM — TODO

## Fase 1: Schema e Banco de Dados
- [x] Tabela `leads` (empresa, segmento, contato, whatsapp, etapa, origem)
- [x] Tabela `checklist_items` (etapas do funil por lead)
- [x] Tabela `meetings` (reuniões agendadas por lead)
- [x] Tabela `proposals` (propostas personalizadas por lead)
- [x] Tabela `contracts` (contratos digitais por lead)
- [x] Tabela `interactions` (histórico de interações por lead)
- [x] Tabela `follow_ups` (configuração e controle de follow-ups automáticos)
- [x] Tabela `trials` (período de trial por cliente)
- [x] Tabela `referrals` (programa de indicações)
- [x] Tabela `follow_up_settings` (configurações globais de intervalos)

## Fase 2: Backend — Routers tRPC
- [x] Router `leads`: CRUD completo, mudança de etapa, busca e filtros
- [x] Router `checklist`: marcar/desmarcar etapas por lead
- [x] Router `meetings`: agendar, editar, cancelar reuniões
- [x] Router `proposals`: criar proposta personalizada, enviar link
- [x] Router `contracts`: redigir, enviar, registrar assinatura
- [x] Router `interactions`: registrar e listar histórico por lead
- [x] Router `followUps`: configurar intervalos, listar pendentes, marcar enviado
- [x] Router `trials`: criar trial, rastrear status, notificar vencimento
- [x] Router `referrals`: registrar indicação, rastrear origem, registrar benefício
- [x] Router `metrics`: métricas do funil, taxas de conversão, receita
- [x] Router `llm`: gerar mensagens personalizadas de follow-up, propostas e comunicados

## Fase 3: Automações e Tarefas Recorrentes
- [x] Handler `/api/scheduled/followup-check` — verifica leads sem resposta e dispara follow-ups com LLM
- [x] Handler `/api/scheduled/trial-expiry` — notifica vencimento de trials
- [x] Integração LLM para geração de mensagens personalizadas por perfil e etapa
- [x] Configuração de intervalos de follow-up pelo usuário
- [ ] Heartbeat cron para follow-up automático (requer deploy — criar após publicar)
- [ ] Heartbeat cron para verificação de trials (requer deploy — criar após publicar)

## Fase 4: Frontend — Layout e Design System
- [x] Configurar paleta de cores elegante (tons escuros + dourado/âmbar)
- [x] Configurar tipografia refinada (Inter + Playfair Display)
- [x] CRMLayout com sidebar completa e navegação
- [x] Rotas no App.tsx para todas as páginas

## Fase 5: Dashboard Executivo
- [x] Cards de métricas: total leads, clientes ativos, receita mensal, leads perdidos
- [x] Funil visual de vendas (gráfico de barras horizontais por etapa)
- [x] Lista de leads recentes
- [x] Atividade recente do sistema

## Fase 6: Gestão de Leads
- [x] Listagem de leads com busca e filtros por etapa
- [x] Formulário de cadastro/edição de lead
- [x] Visualização detalhada do lead (perfil completo)
- [x] Checklist interativo de etapas do funil por lead
- [x] Linha do tempo de histórico de interações

## Fase 7: Reuniões e Agendamentos
- [x] Listagem de reuniões agendadas
- [x] Formulário de agendamento (data, hora, modalidade, link)
- [x] Integração com lead e histórico

## Fase 8: Propostas
- [x] Formulário de criação de proposta personalizada
- [x] Geração de mensagem personalizada via IA
- [x] Envio por link público (/proposals/view/:token)
- [x] Visualização pública da proposta

## Fase 9: Contratos
- [x] Formulário de redação de contrato
- [x] Envio para assinatura
- [x] Registro de status de assinatura

## Fase 10: Follow-up Automático
- [x] Página de configuração de intervalos de follow-up
- [x] Listagem de follow-ups pendentes e enviados
- [x] Geração de mensagem via LLM
- [x] Controle de tentativas por lead

## Fase 11: Trial e Indicações
- [x] Página de gestão de trials (status, vencimento, dias restantes)
- [x] Página de programa de indicações (registrar, rastrear, benefícios)

## Fase 12: Testes e Entrega
- [x] Testes Vitest para routers principais (12 testes passando)
- [x] Ajustes visuais finais
- [x] Checkpoint e entrega
