-- =====================================================
-- VERIFICAR QUERY DOS PROFISSIONAIS
-- =====================================================

-- 1. VERIFICAR SE EXISTEM PROFISSIONAIS VINCULADOS
SELECT 
    'PROFISSIONAIS VINCULADOS' as secao,
    COUNT(*) as total_profissionais
FROM salon_professionals 
WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
AND status = 'accepted';

-- 2. VERIFICAR OS IDs DOS PROFISSIONAIS
SELECT 
    'IDS DOS PROFISSIONAIS' as secao,
    professional_id
FROM salon_professionals 
WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
AND status = 'accepted';

-- 3. VERIFICAR SE EXISTEM POSTS DESTES PROFISSIONAIS
SELECT 
    'POSTS DOS PROFISSIONAIS' as secao,
    COUNT(*) as total_posts
FROM posts p
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
    AND status = 'accepted'
);

-- 4. VERIFICAR POSTS PRINCIPAIS DESTES PROFISSIONAIS
SELECT 
    'POSTS PRINCIPAIS DOS PROFISSIONAIS' as secao,
    COUNT(*) as total_posts_principais
FROM posts p
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
    AND status = 'accepted'
)
AND p.is_salon_main_post = true;
