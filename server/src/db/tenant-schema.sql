-- Schema template tenant — NORMX Tax (CGI-242)
-- Chaque organisation obtient son propre schema

CREATE SCHEMA IF NOT EXISTS "${schema}";

CREATE TABLE IF NOT EXISTS "${schema}".users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nom VARCHAR(255) DEFAULT '',
  prenom VARCHAR(255) DEFAULT '',
  telephone VARCHAR(50),
  pays VARCHAR(10) DEFAULT '242',
  role VARCHAR(20) DEFAULT 'USER',
  mfa_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "${schema}".conversations (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(255) REFERENCES "${schema}".users(id),
  title VARCHAR(500) DEFAULT 'Nouvelle conversation',
  agent VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "${schema}".messages (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id VARCHAR(255) REFERENCES "${schema}".conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  articles_refs JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "${schema}".search_history (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(255) REFERENCES "${schema}".users(id),
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "${schema}".usage_stats (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(255) REFERENCES "${schema}".users(id),
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "${schema}".alertes_fiscales (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(255) REFERENCES "${schema}".users(id),
  type VARCHAR(50) NOT NULL,
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  date_echeance DATE,
  statut VARCHAR(20) DEFAULT 'active',
  lu BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "${schema}".audit_log (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  actor_id VARCHAR(255),
  actor_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  ip_address VARCHAR(50),
  changes JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_conversations_user ON "${schema}".conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON "${schema}".messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_search_user ON "${schema}".search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_user ON "${schema}".usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_alertes_user ON "${schema}".alertes_fiscales(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON "${schema}".audit_log(created_at);
