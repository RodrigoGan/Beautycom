-- =====================================================
-- VERIFICAR HOOK SIMPLIFICADO (APENAS COLUNAS QUE EXISTEM)
-- =====================================================

-- 1. VERIFICAR PROFISSIONAIS VINCULADOS AO SALÃO
SELECT 
    'PROFISSIONAIS VINCULADOS' as secao,
    professional_id
FROM salon_professionals 
WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
AND status = 'accepted';

-- 2. VERIFICAR QUERY SIMPLIFICADA DO HOOK
SELECT 
    'QUERY SIMPLIFICADA' as secao,
    p.id,
    p.title,
    p.description,
    p.media_urls,
    p.created_at,
    p.user_id,
    p.salon_main_post_priority,
    u.name as author_name,
    u.nickname as author_nickname
FROM posts p
INNER JOIN users u ON p.user_id = u.id
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
    AND status = 'accepted'
)
AND p.is_salon_main_post = true
ORDER BY p.salon_main_post_priority ASC;
