-- ========================================
-- CONFIGURAÇÃO CORS VIA SQL
-- ========================================
-- Execute estas queries no Supabase SQL Editor

-- 1. Verificar configurações atuais
SELECT 
    name,
    setting,
    context
FROM pg_settings 
WHERE name LIKE '%cors%' OR name LIKE '%origin%';

-- 2. Configurar CORS para desenvolvimento local
-- Nota: Estas configurações podem não estar disponíveis no plano gratuito
-- Se der erro, use a configuração via Dashboard

-- 3. Verificar se há políticas RLS que estão bloqueando
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'posts')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- 4. Criar política RLS permissiva para desenvolvimento
-- (Execute apenas se necessário)
-- Primeiro remover políticas existentes se houver
DROP POLICY IF EXISTS "Allow anonymous read access to users" ON users;
DROP POLICY IF EXISTS "Allow anonymous read access to posts" ON posts;

-- Depois criar as novas políticas
CREATE POLICY "Allow anonymous read access to users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to posts" ON posts
    FOR SELECT USING (true);

-- 5. Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'posts')
AND policyname LIKE '%anonymous%'
ORDER BY tablename, policyname;
