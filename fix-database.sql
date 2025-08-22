-- ========================================
-- CORREÇÕES PARA O BANCO DE DADOS
-- ========================================

-- 1. REMOVER COLUNA 'role' PROBLEMÁTICA
-- Execute esta query primeiro para remover a coluna antiga
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- 2. HABILITAR RLS NAS TABELAS PROBLEMÁTICAS
-- Execute estas queries para habilitar RLS
ALTER TABLE post_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS RLS BÁSICAS
-- Política para post_favorites
CREATE POLICY "Users can view their own favorites" ON post_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON post_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON post_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Política para post_shares
CREATE POLICY "Users can view all shares" ON post_shares
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own shares" ON post_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. VERIFICAR SE A CORREÇÃO FUNCIONOU
-- Execute esta query para verificar se a coluna 'role' foi removida
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'role';

-- 5. VERIFICAR RLS
-- Execute esta query para verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('post_favorites', 'post_shares');
