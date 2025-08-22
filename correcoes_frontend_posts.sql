-- CORREÇÕES PARA PROBLEMAS DO FRONTEND
-- 1. Estrela branca em vez de amarela
-- 2. Quarto post não permite adicionar

-- 1. VERIFICAR POSTS PRINCIPAIS ATUAIS
SELECT 
    'POSTS PRINCIPAIS ATUAIS' as status,
    id,
    title,
    is_salon_main_post,
    salon_main_post_priority,
    user_id,
    created_at
FROM posts 
WHERE is_salon_main_post = true
ORDER BY salon_main_post_priority;

-- 2. VERIFICAR SE HÁ POSTS COM PRIORIDADE MAS NÃO MARCADOS COMO PRINCIPAIS
SELECT 
    'POSTS INCONSISTENTES' as status,
    id,
    title,
    is_salon_main_post,
    salon_main_post_priority,
    user_id
FROM posts 
WHERE (is_salon_main_post = false AND salon_main_post_priority IS NOT NULL)
   OR (is_salon_main_post = true AND salon_main_post_priority IS NULL);

-- 3. CORRIGIR POSTS INCONSISTENTES
-- Remover prioridade de posts não marcados como principais
UPDATE posts 
SET salon_main_post_priority = NULL
WHERE is_salon_main_post = false 
AND salon_main_post_priority IS NOT NULL;

-- Marcar como principal posts que têm prioridade mas não estão marcados
UPDATE posts 
SET is_salon_main_post = true
WHERE is_salon_main_post = false 
AND salon_main_post_priority IS NOT NULL;

-- 4. REORGANIZAR PRIORIDADES (1, 2, 3)
WITH ranked_posts AS (
  SELECT 
    id,
    title,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_priority
  FROM posts 
  WHERE is_salon_main_post = true
  ORDER BY created_at ASC
  LIMIT 3
)
UPDATE posts 
SET salon_main_post_priority = rp.new_priority
FROM ranked_posts rp
WHERE posts.id = rp.id;

-- 5. REMOVER POSTS PRINCIPAIS EXTRAS (manter apenas 3)
UPDATE posts 
SET 
    is_salon_main_post = false,
    salon_main_post_priority = NULL
WHERE is_salon_main_post = true
AND salon_main_post_priority > 3;

-- 6. VERIFICAR RESULTADO FINAL
SELECT 
    'RESULTADO FINAL' as status,
    id,
    title,
    is_salon_main_post,
    salon_main_post_priority,
    user_id
FROM posts 
WHERE is_salon_main_post = true
ORDER BY salon_main_post_priority;

-- 7. VERIFICAR SE HÁ POSTS PRINCIPAIS SEM PRIORIDADE
SELECT 
    'POSTS PRINCIPAIS SEM PRIORIDADE' as status,
    COUNT(*) as quantidade
FROM posts 
WHERE is_salon_main_post = true
AND salon_main_post_priority IS NULL;

-- 8. VERIFICAR SE HÁ POSTS COM PRIORIDADE MAS NÃO PRINCIPAIS
SELECT 
    'POSTS COM PRIORIDADE MAS NÃO PRINCIPAIS' as status,
    COUNT(*) as quantidade
FROM posts 
WHERE is_salon_main_post = false
AND salon_main_post_priority IS NOT NULL;
