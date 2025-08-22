-- =====================================================
-- VERIFICAR ESTRUTURA COMPLETA DO media_urls
-- =====================================================

-- 1. VERIFICAR POSTS PRINCIPAIS COM media_urls COMPLETO
SELECT 
    'POSTS PRINCIPAIS - media_urls COMPLETO' as secao,
    p.id,
    p.title,
    p.media_urls,
    p.post_type,
    p.salon_main_post_priority
FROM posts p
WHERE p.is_salon_main_post = true
ORDER BY p.salon_main_post_priority ASC;

-- 2. VERIFICAR POSTS NORMAIS PARA COMPARAR
SELECT 
    'POSTS NORMAIS - media_urls COMPLETO' as secao,
    p.id,
    p.title,
    p.media_urls,
    p.post_type,
    p.created_at
FROM posts p
WHERE p.user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
AND p.is_salon_main_post = false
ORDER BY p.created_at DESC
LIMIT 5;

