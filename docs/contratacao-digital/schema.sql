-- Contratação Digital — CRM Morro Digital
-- Ajustar tipos/constraints conforme banco utilizado no projeto.
-- Recomendado para PostgreSQL/Supabase.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  client_id UUID NOT NULL,
  proposal_id UUID,

  provider VARCHAR(50) NOT NULL DEFAULT 'zapsign',
  provider_document_id VARCHAR(255),
  provider_external_id VARCHAR(255),

  contract_number VARCHAR(100) UNIQUE,
  title VARCHAR(255) NOT NULL,

  status VARCHAR(50) NOT NULL DEFAULT 'draft',

  original_pdf_url TEXT,
  signed_pdf_url TEXT,
  certificate_url TEXT,
  signing_url TEXT,

  template_id VARCHAR(255),
  contract_html TEXT,
  contract_payload JSONB,

  sent_at TIMESTAMP,
  signed_at TIMESTAMP,
  expires_at TIMESTAMP,

  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_proposal_id ON contracts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_provider_document_id ON contracts(provider_document_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

CREATE TABLE IF NOT EXISTS contract_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  client_id UUID,

  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  document_number VARCHAR(50),

  role VARCHAR(50) DEFAULT 'client',
  provider_signer_id VARCHAR(255),
  signing_url TEXT,

  status VARCHAR(50) DEFAULT 'pending',
  signed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_signers_contract_id ON contract_signers(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_signers_status ON contract_signers(status);

CREATE TABLE IF NOT EXISTS signature_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  provider VARCHAR(50) NOT NULL,
  provider_event_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,

  raw_payload JSONB NOT NULL,

  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_signature_events_provider_event_unique
ON signature_events(provider, provider_event_id)
WHERE provider_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_signature_events_contract_id ON signature_events(contract_id);
CREATE INDEX IF NOT EXISTS idx_signature_events_event_type ON signature_events(event_type);
CREATE INDEX IF NOT EXISTS idx_signature_events_processed ON signature_events(processed);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,

  action VARCHAR(100) NOT NULL,
  actor_type VARCHAR(50),
  actor_id UUID,

  ip_address VARCHAR(100),
  user_agent TEXT,

  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
