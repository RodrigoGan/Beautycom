-- =====================================================
-- VERIFICAR QUERY DO HOOK useSalonMainPosts (CORRIGIDO)
-- =====================================================

-- 1. VERIFICAR PROFISSIONAIS VINCULADOS AO SALÃO
SELECT 
    'PROFISSIONAIS VINCULADOS' as secao,
    professional_id
FROM salon_professionals 
WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
AND status = 'accepted';

-- 2. VERIFICAR QUERY EXATA DO HOOK (CORRIGIDA)
SELECT 
    'QUERY EXATA DO HOOK' as secao,
    p.id,
    p.title,
    p.description,
    p.isVideo,
    p.isCarousel,
    p.isBeforeAfter,
    p.beforeUrl,
    p.afterUrl,
    p.carouselImages,
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

-- 3. VERIFICAR SE HÁ PROBLEMA COM A JOIN
SELECT 
    'VERIFICAR JOIN' as secao,
    p.id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    CASE 
        WHEN u.id IS NULL THEN 'ERRO: Usuário não encontrado'
        ELSE 'OK: Usuário encontrado'
    END as status_join,
    u.name as author_name
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
    AND status = 'accepted'
)
AND p.is_salon_main_post = true
ORDER BY p.salon_main_post_priority ASC;
