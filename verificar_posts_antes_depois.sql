-- =====================================================
-- VERIFICAR POSTS ANTES E DEPOIS
-- =====================================================

-- ID do salão: 18e3a823-b280-4b75-9518-c01ed31fa197

-- =====================================================
-- 1. VERIFICAR POSTS ANTES E DEPOIS DOS PROFISSIONAIS
-- =====================================================

SELECT 
    'POSTS ANTES E DEPOIS' as tipo,
    p.id as post_id,
    p.title as titulo,
    p.post_type,
    p.media_urls,
    p.user_id,
    u.name as autor_nome,
    p.is_active,
    p.created_at
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
      AND status = 'accepted'
)
  AND p.is_active = true
  AND p.post_type = 'before-after'
ORDER BY p.created_at DESC;

-- =====================================================
-- 2. VERIFICAR TODOS OS POSTS DOS PROFISSIONAIS
-- =====================================================

SELECT 
    'TODOS OS POSTS' as tipo,
    p.id as post_id,
    p.title as titulo,
    p.post_type,
    p.media_urls,
    p.user_id,
    u.name as autor_nome,
    p.is_active,
    p.created_at
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
      AND status = 'accepted'
)
  AND p.is_active = true
ORDER BY p.created_at DESC;

-- =====================================================
-- 3. VERIFICAR ESTRUTURA DE MEDIA_URLS
-- =====================================================

SELECT 
    'ESTRUTURA MEDIA_URLS' as tipo,
    p.id as post_id,
    p.title as titulo,
    p.post_type,
    jsonb_typeof(p.media_urls) as tipo_media_urls,
    p.media_urls,
    CASE 
        WHEN p.media_urls ? 'beforeAfter' THEN 'Tem beforeAfter'
        WHEN p.media_urls ? 'before' AND p.media_urls ? 'after' THEN 'Tem before/after'
        ELSE 'Estrutura diferente'
    END as estrutura_encontrada
FROM posts p
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
      AND status = 'accepted'
)
  AND p.is_active = true
  AND p.post_type = 'before-after'
ORDER BY p.created_at DESC;


