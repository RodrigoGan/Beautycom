-- Script 1: Criar tabelas para métricas do salão
-- Execute este script primeiro

-- Criar tabela para seguidores do salão
CREATE TABLE IF NOT EXISTS salon_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES salons_studios(id) ON DELETE CASCADE,
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, follower_id)
);

-- Criar tabela para interações de clientes com o salão
CREATE TABLE IF NOT EXISTS salon_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES salons_studios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('like', 'comment', 'favorite', 'view', 'contact')),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, user_id, interaction_type, post_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_salon_follows_salon_id ON salon_follows(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_follows_follower_id ON salon_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_salon_interactions_salon_id ON salon_interactions(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_interactions_user_id ON salon_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_salon_interactions_type ON salon_interactions(interaction_type);

-- Comentários para documentação
COMMENT ON TABLE salon_follows IS 'Tabela para armazenar seguidores de salões/estúdios';
COMMENT ON TABLE salon_interactions IS 'Tabela para armazenar interações de clientes com salões/estúdios';
COMMENT ON COLUMN salon_interactions.interaction_type IS 'Tipo de interação: like, comment, favorite, view, contact';



