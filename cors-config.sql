-- ========================================
-- CONFIGURAÇÃO CORS PARA SUPABASE
-- ========================================
-- Execute estas queries no Supabase SQL Editor

-- 1. Verificar configurações atuais de CORS
SELECT 
    name,
    setting,
    context
FROM pg_settings 
WHERE name LIKE '%cors%';

-- 2. Configurar CORS para desenvolvimento local
-- Nota: Estas configurações devem ser feitas no Dashboard do Supabase
-- Vá para Settings > API > CORS Configuration

-- URLs permitidas para CORS:
-- http://localhost:8000
-- http://localhost:3000
-- http://localhost:5173
-- https://seu-dominio-producao.com

-- 3. Verificar se há políticas RLS que possam estar bloqueando
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'posts', 'post_favorites', 'post_shares');

-- 4. Criar política RLS mais permissiva para desenvolvimento
-- (Execute apenas se necessário)
CREATE POLICY "Allow anonymous read access to users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to posts" ON posts
    FOR SELECT USING (true);
