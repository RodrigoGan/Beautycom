-- =====================================================
-- VERIFICAR ESTADO APÓS CLICAR NA ESTRELA (SIMPLES)
-- =====================================================

-- 1. VERIFICAR POSTS PRINCIPAIS APÓS AÇÃO
SELECT 
    'POSTS PRINCIPAIS APÓS AÇÃO' as secao,
    p.id as post_id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    u.name as autor_nome,
    u.nickname as autor_apelido
FROM posts p
INNER JOIN users u ON p.user_id = u.id
WHERE p.is_salon_main_post = true
ORDER BY p.salon_main_post_priority ASC;

-- 2. VERIFICAR TOTAL DE POSTS PRINCIPAIS
SELECT 
    'TOTAL POSTS PRINCIPAIS' as secao,
    COUNT(*) as total_posts_principais
FROM posts 
WHERE is_salon_main_post = true;

-- 3. VERIFICAR TABELA salon_main_posts (DEVERIA ESTAR VAZIA)
SELECT 
    'TABELA salon_main_posts (DEVERIA ESTAR VAZIA)' as secao,
    COUNT(*) as total_registros
FROM salon_main_posts;
