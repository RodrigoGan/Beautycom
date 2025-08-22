-- =====================================================
-- VERIFICAR QUERY COMPLETA DO HOOK
-- =====================================================

-- 1. VERIFICAR PROFISSIONAIS VINCULADOS
SELECT 
    'PROFISSIONAIS VINCULADOS' as secao,
    professional_id
FROM salon_professionals 
WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
AND status = 'accepted';

-- 2. VERIFICAR QUERY COMPLETA DOS POSTS PRINCIPAIS
SELECT 
    'QUERY COMPLETA POSTS PRINCIPAIS' as secao,
    p.id,
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
    END as status_join
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
    AND status = 'accepted'
)
AND p.is_salon_main_post = true;
