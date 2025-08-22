-- =====================================================
-- TESTAR URL DIRETA DO SUPABASE
-- =====================================================

-- Pegar uma URL específica para testar
SELECT 
    p.id,
    p.title,
    p.media_urls,
    CASE 
        WHEN jsonb_typeof(media_urls) = 'object' THEN media_urls->>'url'
        WHEN jsonb_typeof(media_urls) = 'array' THEN media_urls->0->>'url'
        ELSE media_urls::text
    END as extracted_url
FROM posts p
WHERE media_urls IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;

-- =====================================================
-- VERIFICAR SE URL EXISTE NO STORAGE
-- =====================================================

-- Listar arquivos no bucket post-media
SELECT 
    name,
    bucket_id,
    created_at
FROM storage.objects 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'post-media')
ORDER BY created_at DESC
LIMIT 5; 