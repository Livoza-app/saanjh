-- Design for a later production implementation; NOT installed by this prototype.
-- Requires pgvector extension and application-level authentication/authorization.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS scripture_verses (
 id TEXT PRIMARY KEY,
 book TEXT NOT NULL,
 chapter SMALLINT NOT NULL,
 verse SMALLINT NOT NULL,
 original_text TEXT NOT NULL,
 translation_text TEXT NOT NULL,
 translator TEXT NOT NULL,
 source_url TEXT NOT NULL,
 interpretation_status TEXT NOT NULL DEFAULT 'unreviewed',
 embedding vector(512)
);
CREATE INDEX IF NOT EXISTS scripture_embedding_hnsw ON scripture_verses USING hnsw (embedding vector_cosine_ops);
CREATE TABLE IF NOT EXISTS parent_accounts (
 id UUID PRIMARY KEY,
 display_name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS child_profiles (
 id UUID PRIMARY KEY,
 parent_id UUID NOT NULL REFERENCES parent_accounts(id) ON DELETE CASCADE,
 nickname TEXT NOT NULL,
 age SMALLINT NOT NULL CHECK(age BETWEEN 1 AND 17),
 concerns TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS conversations (
 id UUID PRIMARY KEY,
 parent_id UUID NOT NULL REFERENCES parent_accounts(id) ON DELETE CASCADE,
 child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS conversation_messages (
 id UUID PRIMARY KEY,
 conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 parent_id UUID NOT NULL REFERENCES parent_accounts(id) ON DELETE CASCADE,
 role TEXT NOT NULL CHECK(role IN ('parent','assistant')),
 body TEXT NOT NULL,
 verse_id TEXT REFERENCES scripture_verses(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS confirmed_memory (
 id UUID PRIMARY KEY,
 parent_id UUID NOT NULL REFERENCES parent_accounts(id) ON DELETE CASCADE,
 child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
 fact TEXT NOT NULL,
 confirmed_by_parent BOOLEAN NOT NULL DEFAULT FALSE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Production must enforce row-level security OR equivalent scoped queries on EVERY table.
-- Before deployment add: account auth, explicit consent, encryption/retention policy,
-- abuse monitoring, deletion/export workflows, regional rules, crisis-routing evaluation.
