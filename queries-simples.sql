-- ========================================
-- QUERIES SIMPLES PARA DIAGNÓSTICO
-- ========================================
-- Execute uma query por vez no Supabase SQL Editor

-- QUERY 1: Contar usuários
SELECT COUNT(*) as total_usuarios FROM users;

-- QUERY 2: Verificar tipos de usuário
SELECT 
    user_type,
    COUNT(*) as quantidade
FROM users 
GROUP BY user_type;

-- QUERY 3: Verificar se há posts
SELECT COUNT(*) as total_posts FROM posts;

-- QUERY 4: Verificar RLS da tabela users
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'users';

-- QUERY 5: Teste de acesso anônimo
SELECT COUNT(*) as usuarios_anonimo FROM users;

-- QUERY 6: Verificar estrutura da tabela users
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
