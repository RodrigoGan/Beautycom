-- =====================================================
-- VERIFICAR POSTS E CATEGORIAS
-- =====================================================

-- ID do salão: 18e3a823-b280-4b75-9518-c01ed31fa197

-- =====================================================
-- 1. VERIFICAR POSTS DOS PROFISSIONAIS DO SALÃO
-- =====================================================

SELECT 
    'POSTS COM CATEGORIAS' as tipo,
    p.id as post_id,
    p.title as titulo,
    p.category_id,
    c.name as categoria_nome,
    p.user_id,
    u.name as autor_nome,
    p.is_active,
    p.created_at
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
      AND status = 'accepted'
)
  AND p.is_active = true
ORDER BY p.created_at DESC;

-- =====================================================
-- 2. VERIFICAR CATEGORIAS DISPONÍVEIS
-- =====================================================

SELECT 
    'CATEGORIAS DISPONÍVEIS' as tipo,
    id,
    name as nome_categoria,
    description as descricao,
    is_active
FROM categories
WHERE is_active = true
ORDER BY name;

-- =====================================================
-- 3. VERIFICAR SE HÁ POSTS SEM CATEGORIA
-- =====================================================

SELECT 
    'POSTS SEM CATEGORIA' as tipo,
    p.id as post_id,
    p.title as titulo,
    p.category_id,
    p.user_id,
    u.name as autor_nome,
    p.is_active
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
      AND status = 'accepted'
)
  AND p.is_active = true
  AND p.category_id IS NULL
ORDER BY p.created_at DESC;

-- =====================================================
-- 4. CONTAR POSTS POR CATEGORIA
-- =====================================================

SELECT 
    'CONTAGEM POR CATEGORIA' as tipo,
    c.name as categoria_nome,
    COUNT(*) as total_posts
FROM posts p
JOIN categories c ON p.category_id = c.id
WHERE p.user_id IN (
    SELECT professional_id 
    FROM salon_professionals 
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
      AND status = 'accepted'
)
  AND p.is_active = true
GROUP BY c.id, c.name
ORDER BY total_posts DESC;


