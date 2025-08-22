-- =====================================================
-- VERIFICAR POSTS MARCADOS COMO PRINCIPAIS
-- =====================================================

-- VERIFICAR DETALHES DOS POSTS PRINCIPAIS
SELECT 
    'DETALHES DOS POSTS PRINCIPAIS' as secao,
    p.id as post_id,
    p.title,
    p.user_id,
    p.is_salon_main_post,
    p.salon_main_post_priority,
    u.name as autor_nome,
    u.nickname as autor_apelido,
    p.created_at,
    p.updated_at
FROM posts p
INNER JOIN users u ON p.user_id = u.id
WHERE p.is_salon_main_post = true
ORDER BY p.salon_main_post_priority ASC;
