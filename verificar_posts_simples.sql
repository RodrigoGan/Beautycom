-- =====================================================
-- VERIFICAR POSTS SIMPLES
-- =====================================================

-- Contar total de posts
SELECT COUNT(*) as total_posts FROM posts WHERE is_active = true;

-- Listar posts mais recentes
SELECT 
    id,
    title,
    description,
    post_type,
    created_at
FROM posts 
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 3;

-- =====================================================
-- VERIFICAR SE HÁ POSTS DO USUÁRIO RODRIGO
-- =====================================================

-- Buscar posts do Rodrigo
SELECT 
    p.id,
    p.title,
    p.description,
    p.post_type,
    p.created_at,
    u.nickname as author
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE u.email = 'rodrigo_gan@hotmail.com'
ORDER BY p.created_at DESC; 