-- =====================================================
-- DIAGNÓSTICO: CATEGORIAS NO FILTRO DE POSTS
-- =====================================================

-- ID do salão: 18e3a823-b280-4b75-9518-c01ed31fa197
-- Owner: e4fe20f9-fec8-483f-86cc-5cf6f1106942

-- =====================================================
-- 1. VERIFICAR PROFISSIONAIS DO SALÃO
-- =====================================================

SELECT 
    'PROFISSIONAIS DO SALÃO' as tipo,
    sp.professional_id,
    u.name as nome_profissional,
    u.email as email_profissional,
    sp.status,
    u.categories as categorias_profissional
FROM salon_professionals sp
JOIN users u ON sp.professional_id = u.id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
  AND sp.status = 'accepted'
ORDER BY u.name;

-- =====================================================
-- 2. VERIFICAR POSTS DOS PROFISSIONAIS
-- =====================================================

SELECT 
    'POSTS DOS PROFISSIONAIS' as tipo,
    p.id as post_id,
    p.titulo,
    p.category_id,
    c.name as categoria_nome,
    p.user_id,
    u.name as autor_nome,
    p.is_active
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
-- 3. SIMULAR A QUERY DO FILTRO
-- =====================================================

-- Primeiro, buscar profissionais (como o filtro faz)
WITH profissionais_aceitos AS (
    SELECT professional_id
    FROM salon_professionals
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
      AND status = 'accepted'
),
-- Depois, buscar categorias dos posts (como o filtro faz)
categorias_dos_posts AS (
    SELECT 
        p.category_id,
        c.id as category_id_real,
        c.name as category_name
    FROM posts p
    JOIN categories c ON p.category_id = c.id
    WHERE p.user_id IN (SELECT professional_id FROM profissionais_aceitos)
      AND p.is_active = true
)
SELECT 
    'CATEGORIAS ENCONTRADAS PELO FILTRO' as tipo,
    category_id,
    category_name,
    COUNT(*) as total_posts_com_esta_categoria
FROM categorias_dos_posts
GROUP BY category_id, category_name
ORDER BY total_posts_com_esta_categoria DESC;

-- =====================================================
-- 4. VERIFICAR SE HÁ POSTS INATIVOS OU PROBLEMAS
-- =====================================================

SELECT 
    'TODOS OS POSTS (INCLUINDO INATIVOS)' as tipo,
    p.id as post_id,
    p.titulo,
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
ORDER BY p.created_at DESC;

-- =====================================================
-- 5. VERIFICAR CATEGORIAS DISPONÍVEIS
-- =====================================================

SELECT 
    'CATEGORIAS DISPONÍVEIS' as tipo,
    id,
    name as nome_categoria,
    description as descricao,
    is_active
FROM categories
ORDER BY name;


