-- =====================================================
-- VERIFICAR ESTRUTURA EXATA DOS POSTS BEFORE-AFTER
-- =====================================================

-- 1. VERIFICAR POSTS PRINCIPAIS BEFORE-AFTER
SELECT 
    'POSTS PRINCIPAIS BEFORE-AFTER' as secao,
    p.id,
    p.title,
    p.post_type,
    p.media_urls,
    p.salon_main_post_priority
FROM posts p
WHERE p.is_salon_main_post = true
AND p.post_type = 'before-after'
ORDER BY p.salon_main_post_priority ASC;

-- 2. VERIFICAR TODOS OS POSTS BEFORE-AFTER DOS PROFISSIONAIS
SELECT 
    'TODOS OS POSTS BEFORE-AFTER' as secao,
    p.id,
    p.title,
    p.post_type,
    p.media_urls,
    p.user_id,
    u.name as autor
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
      AND status = 'accepted'
)
AND p.post_type = 'before-after'
AND p.is_active = true
ORDER BY p.created_at DESC;

