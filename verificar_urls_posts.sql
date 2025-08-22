-- =====================================================
-- VERIFICAR URLs REAIS DOS POSTS
-- =====================================================

-- Listar posts com suas URLs de mídia
SELECT 
    p.id,
    p.title,
    p.media_urls,
    u.nickname as author_nickname,
    c.name as category
FROM posts p
JOIN users u ON p.user_id = u.id
JOIN categories c ON p.category_id = c.id
ORDER BY p.created_at DESC
LIMIT 10;

-- =====================================================
-- VERIFICAR SE HÁ POSTS COM URLs REAIS
-- =====================================================

-- Contar posts com media_urls não nulos
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN media_urls IS NOT NULL THEN 1 END) as posts_com_media,
    COUNT(CASE WHEN media_urls IS NULL THEN 1 END) as posts_sem_media
FROM posts; 