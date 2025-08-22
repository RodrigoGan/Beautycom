-- Script 2: Criar RLS policies para métricas do salão
-- Execute este script após o primeiro

-- Habilitar RLS nas tabelas
ALTER TABLE salon_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_interactions ENABLE ROW LEVEL SECURITY;

-- Remover policies existentes se houver (para evitar erro de duplicação)
DROP POLICY IF EXISTS "Visualizar seguidores do salão" ON salon_follows;
DROP POLICY IF EXISTS "Seguir/deixar de seguir salão" ON salon_follows;
DROP POLICY IF EXISTS "Visualizar interações do salão" ON salon_interactions;
DROP POLICY IF EXISTS "Criar interações com salão" ON salon_interactions;
DROP POLICY IF EXISTS "Atualizar interações com salão" ON salon_interactions;
DROP POLICY IF EXISTS "Deletar interações com salão" ON salon_interactions;

-- Criar RLS policies para salon_follows
-- Política para visualizar seguidores (todos podem ver)
CREATE POLICY "Visualizar seguidores do salão" ON salon_follows
    FOR SELECT USING (true);

-- Política para seguir/deixar de seguir (usuários autenticados)
CREATE POLICY "Seguir/deixar de seguir salão" ON salon_follows
    FOR ALL USING (auth.uid() = follower_id);

-- Criar RLS policies para salon_interactions
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



