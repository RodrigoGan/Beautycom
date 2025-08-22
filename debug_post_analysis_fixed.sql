-- Análise detalhada do post problemático - VERSÃO CORRIGIDA
-- Post ID: 2d1e6121-5485-4633-8fa1-2e84c68d631a

-- 1. ANÁLISE COMPLETA DO POST PROBLEMÁTICO
SELECT 
    'POST PROBLEMÁTICO' as analise,
    p.id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    p.created_at,
    p.updated_at,
    p.post_type,
    -- Verificar se o post pertence a um profissional do salão
    CASE 
        WHEN sp.professional_id IS NOT NULL THEN 'PROFISSIONAL DO SALÃO'
        WHEN se.user_id IS NOT NULL THEN 'FUNCIONÁRIO DO SALÃO'
        ELSE 'NÃO VINCULADO AO SALÃO'
    END as vinculo_salao,
    -- Dados do autor
    u.name as autor_nome,
    u.nickname as autor_nickname
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN salon_professionals sp ON p.user_id = sp.professional_id AND sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
LEFT JOIN salon_employees se ON p.user_id = se.user_id AND se.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
WHERE p.id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 2. COMPARAÇÃO COM TODOS OS POSTS PRINCIPAIS ATUAIS
SELECT 
    'COMPARAÇÃO POSTS PRINCIPAIS' as analise,
    p.id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    p.created_at,
    u.name as autor,
    -- Verificar se pertence ao salão
    CASE 
        WHEN sp.professional_id IS NOT NULL THEN 'PROFISSIONAL'
        WHEN se.user_id IS NOT NULL THEN 'FUNCIONÁRIO'
        ELSE 'NÃO VINCULADO'
    END as tipo_membro
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN salon_professionals sp ON p.user_id = sp.professional_id AND sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
LEFT JOIN salon_employees se ON p.user_id = se.user_id AND se.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
WHERE p.is_salon_main_post = true
AND p.salon_main_post_priority IS NOT NULL
ORDER BY p.salon_main_post_priority;

-- 3. VERIFICAR SE HÁ POSTS COM PRIORIDADES DUPLICADAS (VERSÃO SIMPLIFICADA)
SELECT 
    'PRIORIDADES DUPLICADAS' as analise,
    salon_main_post_priority,
    COUNT(*) as quantidade
FROM posts p
WHERE p.is_salon_main_post = true
AND p.salon_main_post_priority IS NOT NULL
GROUP BY salon_main_post_priority
HAVING COUNT(*) > 1;

-- 4. VERIFICAR SE HÁ POSTS MARCADOS COMO PRINCIPAIS MAS SEM PRIORIDADE
SELECT 
    'POSTS PRINCIPAIS SEM PRIORIDADE' as analise,
    p.id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority
FROM posts p
WHERE p.is_salon_main_post = true
AND p.salon_main_post_priority IS NULL;

-- 5. VERIFICAR SE HÁ POSTS COM PRIORIDADE MAS NÃO MARCADOS COMO PRINCIPAIS
SELECT 
    'POSTS COM PRIORIDADE MAS NÃO PRINCIPAIS' as analise,
    p.id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority
FROM posts p
WHERE p.is_salon_main_post = false
AND p.salon_main_post_priority IS NOT NULL;

-- 6. VERIFICAR TODOS OS MEMBROS DO SALÃO (PROFISSIONAIS + FUNCIONÁRIOS)
SELECT 
    'MEMBROS DO SALÃO' as analise,
    'PROFISSIONAIS' as tipo,
    sp.professional_id as user_id,
    u.name,
    u.nickname,
    sp.status
FROM salon_professionals sp
LEFT JOIN users u ON sp.professional_id = u.id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
UNION ALL
SELECT 
    'MEMBROS DO SALÃO' as analise,
    'FUNCIONÁRIOS' as tipo,
    se.user_id,
    u.name,
    u.nickname,
    se.status
FROM salon_employees se
LEFT JOIN users u ON se.user_id = u.id
WHERE se.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 7. VERIFICAR SE HÁ ALGUM TRIGGER OU CONSTRAINT ESPECIAL
SELECT 
    'CONSTRAINTS E TRIGGERS' as analise,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'posts'::regclass
AND (conname LIKE '%main%' OR conname LIKE '%priority%');

-- 8. VERIFICAR SE HÁ ALGUM TRIGGER ESPECIAL NA TABELA POSTS
SELECT 
    'TRIGGERS NA TABELA POSTS' as analise,
    tgname as trigger_name,
    tgtype,
    tgenabled,
    tgdeferrable,
    tginitdeferred
FROM pg_trigger 
WHERE tgrelid = 'posts'::regclass
AND (tgname LIKE '%main%' OR tgname LIKE '%priority%');

-- 9. TESTAR UPDATE DIRETO NO POST PROBLEMÁTICO
-- Primeiro, verificar estado atual
SELECT 
    'ESTADO ATUAL POST' as analise,
    id,
    title,
    is_salon_main_post,
    salon_main_post_priority
FROM posts 
WHERE id = '2d1e6121-5485-4633-8fa1-2e84c68d631a';

-- 10. VERIFICAR SE HÁ ALGUM LOCK NA TABELA POSTS
SELECT 
    'LOCKS NA TABELA POSTS' as analise,
    l.pid,
    l.mode,
    l.granted,
    l.locktype,
    l.relation::regclass as table_name
FROM pg_locks l
WHERE l.relation = 'posts'::regclass;
