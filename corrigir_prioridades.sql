-- =====================================================
-- CORRIGIR PRIORIDADES DOS POSTS PRINCIPAIS
-- =====================================================

-- 1. VERIFICAR POSTS PRINCIPAIS ATUAIS
SELECT 
    'POSTS PRINCIPAIS ATUAIS' as secao,
    p.id,
    p.title,
    p.salon_main_post_priority,
    p.created_at
FROM posts p
WHERE p.is_salon_main_post = true
ORDER BY p.created_at ASC;

-- 2. CORRIGIR PRIORIDADES (1, 2, 3 baseado na data de criação)
WITH ranked_posts AS (
  SELECT 
    id,
    title,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_priority
  FROM posts 
  WHERE is_salon_main_post = true
)
UPDATE posts 
SET salon_main_post_priority = rp.new_priority
FROM ranked_posts rp
WHERE posts.id = rp.id;

-- 3. VERIFICAR POSTS PRINCIPAIS APÓS CORREÇÃO
SELECT 
    'POSTS PRINCIPAIS APÓS CORREÇÃO' as secao,
    p.id,
    p.title,
    p.salon_main_post_priority,
    p.created_at
FROM posts p
WHERE p.is_salon_main_post = true
ORDER BY p.salon_main_post_priority ASC;

