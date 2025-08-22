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

-- Criar RLS policies para salon_follows
ALTER TABLE salon_follows ENABLE ROW LEVEL SECURITY;

-- Política para visualizar seguidores (todos podem ver)
CREATE POLICY "Visualizar seguidores do salão" ON salon_follows
    FOR SELECT USING (true);

-- Política para seguir/deixar de seguir (usuários autenticados)
CREATE POLICY "Seguir/deixar de seguir salão" ON salon_follows
    FOR ALL USING (auth.uid() = follower_id);

-- Criar RLS policies para salon_interactions
ALTER TABLE salon_interactions ENABLE ROW LEVEL SECURITY;

-- Política para visualizar interações (todos podem ver)
CREATE POLICY "Visualizar interações do salão" ON salon_interactions
    FOR SELECT USING (true);

-- Política para criar interações (usuários autenticados)
CREATE POLICY "Criar interações com salão" ON salon_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para atualizar interações (próprio usuário)
CREATE POLICY "Atualizar interações com salão" ON salon_interactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para deletar interações (próprio usuário)
CREATE POLICY "Deletar interações com salão" ON salon_interactions
    FOR DELETE USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_salon_follows_updated_at BEFORE UPDATE ON salon_follows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salon_interactions_updated_at BEFORE UPDATE ON salon_interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE salon_follows IS 'Tabela para armazenar seguidores de salões/estúdios';
COMMENT ON TABLE salon_interactions IS 'Tabela para armazenar interações de clientes com salões/estúdios';
COMMENT ON COLUMN salon_interactions.interaction_type IS 'Tipo de interação: like, comment, favorite, view, contact';
