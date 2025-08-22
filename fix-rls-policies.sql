-- ========================================
-- CORREÇÃO DE POLÍTICAS RLS
-- ========================================
-- Execute estas queries no Supabase SQL Editor

-- 1. Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Allow anonymous read access to users" ON users;
DROP POLICY IF EXISTS "Allow anonymous read access to posts" ON posts;

-- 2. Criar políticas mais permissivas para desenvolvimento
CREATE POLICY "Allow anonymous read access to users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to posts" ON posts
    FOR SELECT USING (true);

-- 3. Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'posts')
ORDER BY tablename, policyname;
