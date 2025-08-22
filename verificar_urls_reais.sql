-- =====================================================
-- VERIFICAR URLs REAIS DOS POSTS
-- =====================================================

-- Listar posts com suas URLs de mídia reais
SELECT 
    p.id,
    p.title,
    p.media_urls,
    u.nickname as author_nickname,
    c.name as category,
    p.created_at
FROM posts p
JOIN users u ON p.user_id = u.id
JOIN categories c ON p.category_id = c.id
ORDER BY p.created_at DESC
LIMIT 5;

-- =====================================================
-- VERIFICAR FORMATO DO MEDIA_URLS
-- =====================================================

-- Verificar se media_urls é JSON válido
SELECT 
    id,
    title,
    media_urls,
    CASE 
        WHEN media_urls IS NULL THEN 'NULL'
        WHEN jsonb_typeof(media_urls) = 'object' THEN 'JSON Object'
        WHEN jsonb_typeof(media_urls) = 'array' THEN 'JSON Array'
        WHEN jsonb_typeof(media_urls) = 'string' THEN 'String'
        ELSE 'Other: ' || jsonb_typeof(media_urls)
    END as media_type
FROM posts 
WHERE media_urls IS NOT NULL
ORDER BY created_at DESC
LIMIT 10; 