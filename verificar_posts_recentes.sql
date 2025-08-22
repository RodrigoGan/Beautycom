-- =====================================================
-- VERIFICAR POSTS RECENTES
-- =====================================================

-- Verificar os 5 posts mais recentes com seus media_urls
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
ORDER BY p.created_at DESC
LIMIT 5;

-- =====================================================
-- VERIFICAR FORMATO ESPECÍFICO DOS POSTS
-- =====================================================

-- Verificar posts com URLs reais do Supabase
SELECT 
    id,
    title,
    post_type,
    CASE 
        WHEN media_urls::text LIKE '%supabase.co%' THEN '✅ URL Supabase'
        WHEN media_urls::text LIKE '%example.com%' THEN '❌ URL Exemplo'
        ELSE '❓ Outro formato'
    END as url_status,
    media_urls
FROM posts 
WHERE media_urls IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
