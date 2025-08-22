-- ========================================
-- QUERIES DE DIAGNÓSTICO - SUPABASE
-- ========================================

-- 1. Verificar se a tabela users existe e tem dados
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN user_type = 'profissional' THEN 1 END) as profissionais,
    COUNT(CASE WHEN user_type = 'usuario' THEN 1 END) as usuarios,
    MIN(created_at) as primeiro_usuario,
    MAX(created_at) as ultimo_usuario
FROM users;

-- 2. Verificar estrutura da tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 3. Verificar se há posts na tabela
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN is_active = true THEN 1 END) as posts_ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as posts_inativos,
    MIN(created_at) as primeiro_post,
    MAX(created_at) as ultimo_post
FROM posts;

-- 4. Verificar RLS (Row Level Security) na tabela users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 5. Verificar se há usuários com dados completos
SELECT 
    id,
    name,
    email,
    user_type,
    created_at,
    updated_at
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Verificar se há posts com dados completos
SELECT 
    p.id,
    p.title,
    p.post_type,
    p.is_active,
    p.created_at,
    u.name as author_name,
    u.user_type as author_type
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC 
LIMIT 5;

-- 7. Verificar configurações de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'posts');

-- 8. Teste de query simples com RLS
-- Execute esta query como usuário anônimo (sem autenticação)
SELECT COUNT(*) as total_users_anonimo FROM users;

-- 9. Verificar se há problemas de permissões
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name IN ('users', 'posts')
ORDER BY grantee, table_name;

-- 10. Verificar atividade atual do banco (se disponível)
-- Esta query pode não funcionar dependendo das permissões
SELECT 
    pid,
    usename,
    datname,
    state,
    query_start,
    state_change,
    query
FROM pg_stat_activity 
WHERE state = 'active' 
AND query LIKE '%users%'
ORDER BY query_start DESC 
LIMIT 10;
