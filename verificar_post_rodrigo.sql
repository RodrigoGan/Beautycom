-- =====================================================
-- VERIFICAR POST DO RODRIGO
-- =====================================================

-- Buscar posts do Rodrigo
SELECT 
    p.id,
    p.title,
    p.post_type,
    p.media_urls,
    u.nickname as author,
    c.name as category,
    p.created_at
FROM posts p
JOIN users u ON p.user_id = u.id
JOIN categories c ON p.category_id = c.id
WHERE u.nickname LIKE '%rodrigo%'
ORDER BY p.created_at DESC;

-- =====================================================
-- VERIFICAR POST DA ANA
-- =====================================================

-- Buscar posts da Ana
SELECT 
    p.id,
    p.title,
    p.post_type,
    p.media_urls,
    u.nickname as author,
    c.name as category,
    p.created_at
FROM posts p
JOIN users u ON p.user_id = u.id
JOIN categories c ON p.category_id = c.id
WHERE u.nickname LIKE '%ana%'
ORDER BY p.created_at DESC;

-- =====================================================
-- COMPARAR FORMATOS
-- =====================================================

-- Verificar todos os posts before-after
SELECT 
    p.id,
    p.title,
    p.post_type,
    CASE 
        WHEN p.media_urls::text LIKE '%beforeAfter%' THEN 'Formato Novo'
        WHEN p.media_urls::text LIKE '%before%' AND p.media_urls::text LIKE '%after%' THEN 'Formato Antigo'
        ELSE 'Outro Formato'
    END as formato,
    u.nickname as author,
    p.media_urls
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.post_type = 'before-after'
ORDER BY p.created_at DESC;



