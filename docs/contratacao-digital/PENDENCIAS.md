# Pendencias

Branch: feature/contratacao-digital-local-tested

Aplicado:
- client/src/App.tsx
- client/src/pages/ContractView.tsx
- client/src/pages/Contracts.tsx
- client/src/pages/Proposals.tsx
- drizzle/0002_contratacao_digital.sql
- drizzle/meta/_journal.json
- server/db.ts
- server/signature.ts

Pendente:
- server/routers.ts
- drizzle/schema.ts

Validar antes de merge:
- pnpm install
- pnpm check
- pnpm build
