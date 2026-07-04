# Pendencias

Branch: feature/contratacao-digital-local-tested

Aplicado:
- client/src/App.tsx
- client/src/pages/ContractView.tsx
- client/src/pages/Contracts.tsx
- client/src/pages/Proposals.tsx
- drizzle/0002_contratacao_digital.sql
- drizzle/meta/_journal.json
- drizzle/schema.ts
- server/db.ts
- server/signature.ts

Pendente:
- server/routers.ts

Observacao:
A tentativa de atualizar server/routers.ts pelo conector foi bloqueada pela ferramenta. O arquivo completo revisado esta no patch local: contratacao-digital-tested.patch.

Validar antes de merge:
- pnpm install
- pnpm check
- pnpm build
