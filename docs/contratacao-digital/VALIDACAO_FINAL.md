# Validacao final local

Branch: `feature/contratacao-digital-local-tested`

## Resultado local

A versao final testada localmente passou nos comandos:

```bash
npm test
npm run check
npm run build
```

Resultado:

```txt
npm test: 12/12 testes passaram
npm run check: passou
npm run build: passou
```

## Observacao importante

A versao validada localmente contem um ajuste final no fluxo de criacao de lead para evitar falha de inicializacao de checklist quando o banco nao esta disponivel em ambiente de teste.

O conector bloqueou a tentativa de subir diretamente o ajuste final no `server/routers.ts`.

## Arquivo local validado

O pacote final testado foi gerado como:

```txt
morro-digital-crm-contratacao-digital-final-tested.zip
```

## Antes do merge

Aplicar o ultimo ajuste do ZIP final testado ou repetir localmente:

```bash
npm install --legacy-peer-deps
npm test
npm run check
npm run build
```

A `main` permanece intacta.
