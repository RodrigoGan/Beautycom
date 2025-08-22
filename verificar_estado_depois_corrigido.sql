-- =====================================================
-- VERIFICAR ESTADO APÓS MARCAR POST COMO PRINCIPAL (CORRIGIDO)
-- =====================================================

-- 1. VERIFICAR POSTS PRINCIPAIS APÓS AÇÃO
SELECT 
    'POSTS PRINCIPAIS APÓS AÇÃO' as secao,
    p.id as post_id,
    p.title,  -- CORRIGIDO: era p.titulo
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    u.name as autor_nome,
    u.nickname as autor_apelido,
    p.updated_at
FROM posts p
INNER JOIN users u ON p.user_id = u.id
WHERE p.is_salon_main_post = true
AND p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
    AND status = 'accepted'
)
ORDER BY p.salon_main_post_priority ASC;

-- 2. VERIFICAR TOTAL DE POSTS PRINCIPAIS
SELECT 
    'TOTAL POSTS PRINCIPAIS' as secao,
    COUNT(*) as total_posts_principais
FROM posts 
WHERE is_salon_main_post = true;

-- 3. VERIFICAR SE HÁ POSTS PRINCIPAIS FORA DO SALÃO (DEVERIA SER 0)
SELECT 
    'POSTS PRINCIPAIS FORA DO SALÃO (DEVERIA SER 0)' as secao,
    COUNT(*) as total_posts_fora_salao
FROM posts p
WHERE p.is_salon_main_post = true
AND p.user_id NOT IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
    AND status = 'accepted'
);

-- 4. VERIFICAR TABELA salon_main_posts (DEVERIA ESTAR VAZIA)
SELECT 
    'TABELA salon_main_posts (DEVERIA ESTAR VAZIA)' as secao,
    COUNT(*) as total_registros
FROM salon_main_posts;

-- 5. VERIFICAR POSTS ESPECÍFICOS (SUBSTITUA PELO ID DO POST QUE VOCÊ CLICOU)
-- SELECT 
--     'POST ESPECÍFICO' as secao,
--     p.id as post_id,
--     p.title,  -- CORRIGIDO: era p.titulo
--     p.is_salon_main_post,
--     p.salon_main_post_priority,
--     p.updated_at
-- FROM posts p
-- WHERE p.id = 'ID_DO_POST_QUE_VOCE_CLICOU';
