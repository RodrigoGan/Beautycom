-- Verificar problemas de RLS (Row Level Security) que podem estar afetando as operações

-- 1. VERIFICAR SE RLS ESTÁ HABILITADO NA TABELA POSTS
SELECT 
    'RLS STATUS POSTS' as analise,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'posts';

-- 2. VERIFICAR POLÍTICAS RLS NA TABELA POSTS
SELECT 
    'POLÍTICAS RLS POSTS' as analise,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'posts';

-- 3. VERIFICAR SE O USUÁRIO ATUAL TEM PERMISSÕES PARA UPDATE NA TABELA POSTS
SELECT 
    'PERMISSÕES USUÁRIO' as analise,
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'posts'
AND grantee IN ('authenticated', 'anon', 'service_role');

-- 4. VERIFICAR SE HÁ ALGUM TRIGGER QUE PODE ESTAR INTERFERINDO
SELECT 
    'TRIGGERS INTERFERINDO' as analise,
    tgname as trigger_name,
    tgtype,
    tgenabled,
    tgdeferrable,
    tginitdeferred,
    tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgrelid = 'posts'::regclass
AND tgenabled = 't';

-- 5. VERIFICAR SE HÁ ALGUM CONSTRAINT QUE PODE ESTAR BLOQUEANDO
SELECT 
    'CONSTRAINTS BLOQUEANDO' as analise,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'posts'::regclass;

-- 6. TESTAR UPDATE DIRETO NO POST PROBLEMÁTICO (SIMULAR OPERAÇÃO)
-- Primeiro, verificar estado atual
SELECT 
    'ESTADO ATUAL POST' as analise,
    id,
    title,
    is_salon_main_post,
    salon_main_post_priority
FROM posts 
WHERE id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 7. VERIFICAR SE HÁ ALGUM LOCK NA TABELA POSTS
SELECT 
    'LOCKS NA TABELA POSTS' as analise,
    l.pid,
    l.mode,
    l.granted,
    l.locktype,
    l.database,
    l.relation::regclass as table_name,
    a.usename,
    a.application_name,
    a.client_addr
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE l.relation = 'posts'::regclass;

-- 8. VERIFICAR SE HÁ ALGUM PROBLEMA COM O USUÁRIO AUTENTICADO
SELECT 
    'USUÁRIO AUTENTICADO' as analise,
    current_user as usuario_atual,
    session_user as usuario_sessao,
    current_database() as banco_atual,
    current_schema() as schema_atual;

-- 9. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CONTEXTO DE AUTENTICAÇÃO
SELECT 
    'CONTEXTO AUTH' as analise,
    auth.uid() as user_id,
    auth.role() as role,
    auth.email() as email;

-- 10. VERIFICAR SE HÁ ALGUM PROBLEMA ESPECÍFICO COM O POST
-- Testar se conseguimos fazer um UPDATE simples
-- (Comentar esta linha se não quiser fazer alteração real)
-- UPDATE posts SET updated_at = NOW() WHERE id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 11. VERIFICAR SE HÁ ALGUM PROBLEMA COM O SALÃO
SELECT 
    'DADOS DO SALÃO' as analise,
    s.id,
    s.name,
    s.owner_id,
    s.created_at,
    s.updated_at
FROM salons_studios s
WHERE s.id = '18e3a823-b280-4b75-9518-c01ed31fa197';
