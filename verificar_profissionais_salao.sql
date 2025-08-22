-- =====================================================
-- VERIFICAR PROFISSIONAIS DO SALÃO
-- =====================================================

-- 1. VERIFICAR PROFISSIONAIS VINCULADOS AO SALÃO
SELECT 
    'PROFISSIONAIS DO SALÃO' as secao,
    sp.salon_id,
    sp.professional_id,
    sp.status,
    u.name as nome_profissional,
    u.nickname as apelido_profissional
FROM salon_professionals sp
INNER JOIN users u ON sp.professional_id = u.id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
AND sp.status = 'accepted';

-- 2. VERIFICAR POSTS DOS PROFISSIONAIS (INCLUINDO PRINCIPAIS)
SELECT 
    'POSTS DOS PROFISSIONAIS' as secao,
    p.id as post_id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    u.name as autor_nome,
    u.nickname as autor_apelido
FROM posts p
INNER JOIN users u ON p.user_id = u.id
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
    AND status = 'accepted'
)
ORDER BY p.created_at DESC;

-- 3. VERIFICAR APENAS POSTS PRINCIPAIS
SELECT 
    'POSTS PRINCIPAIS APENAS' as secao,
    p.id as post_id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    u.name as autor_nome,
    u.nickname as autor_apelido
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
