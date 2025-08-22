-- =====================================================
-- TESTE DA ESTRUTURA CORRETA: HABILIDADES DOS PROFISSIONAIS
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
ORDER BY sp.status, u.name;

-- =====================================================
-- 2. VERIFICAR CATEGORIAS DISPONÍVEIS
-- =====================================================

SELECT 
    'CATEGORIAS DISPONÍVEIS' as tipo,
    id,
    name as nome_categoria,
    description as descricao
FROM categories
ORDER BY name;

-- =====================================================
-- 3. VERIFICAR SE PROFISSIONAIS TÊM CATEGORIAS
-- =====================================================

SELECT 
    'PROFISSIONAIS COM CATEGORIAS' as tipo,
    u.name as nome_profissional,
    u.categories as categorias_ids,
    array_length(u.categories, 1) as total_categorias
FROM salon_professionals sp
JOIN users u ON sp.professional_id = u.id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
  AND sp.status = 'accepted'
  AND u.categories IS NOT NULL
  AND array_length(u.categories, 1) > 0
ORDER BY u.name;

-- =====================================================
-- 4. TESTE COMPLETO - HABILIDADES DOS PROFISSIONAIS
-- =====================================================

WITH profissionais_aceitos AS (
    SELECT professional_id
    FROM salon_professionals
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
      AND status = 'accepted'
),
categorias_agrupadas AS (
    SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(DISTINCT u.id) as profissionais_count
    FROM users u
    JOIN categories c ON c.id = ANY(u.categories)
    WHERE u.id IN (SELECT professional_id FROM profissionais_aceitos)
      AND u.categories IS NOT NULL
      AND array_length(u.categories, 1) > 0
    GROUP BY c.id, c.name
)
SELECT 
    'RESULTADO FINAL' as tipo,
    category_id,
    category_name,
    profissionais_count
FROM categorias_agrupadas
ORDER BY profissionais_count DESC, category_name;

-- =====================================================
-- 5. VERIFICAR ESTRUTURA DA TABELA USERS
-- =====================================================

SELECT 
    'ESTRUTURA USERS' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('id', 'name', 'user_type', 'categories')
ORDER BY ordinal_position;

-- =====================================================
-- 6. VERIFICAR DADOS DE EXEMPLO
-- =====================================================

SELECT 
    'DADOS DE EXEMPLO' as tipo,
    u.name as nome,
    u.user_type as tipo_usuario,
    u.categories as categorias,
    array_length(u.categories, 1) as total_categorias
FROM users u
WHERE u.categories IS NOT NULL
  AND array_length(u.categories, 1) > 0
LIMIT 5;

-- =====================================================
-- 7. SIMULAÇÃO DO COMPONENTE SALONSKILLS
-- =====================================================

-- Esta consulta simula exatamente o que o componente SalonSkills faz agora
SELECT 
    'SIMULAÇÃO COMPONENTE' as tipo,
    'Etapa 1: Profissionais encontrados' as etapa,
    COUNT(*) as total
FROM salon_professionals
WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
  AND status = 'accepted';

SELECT 
    'SIMULAÇÃO COMPONENTE' as tipo,
    'Etapa 2: Profissionais com categorias' as etapa,
    COUNT(*) as total
FROM salon_professionals sp
JOIN users u ON sp.professional_id = u.id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
  AND sp.status = 'accepted'
  AND u.categories IS NOT NULL
  AND array_length(u.categories, 1) > 0;

SELECT 
    'SIMULAÇÃO COMPONENTE' as tipo,
    'Etapa 3: Categorias únicas encontradas' as etapa,
    COUNT(DISTINCT c.id) as total_categorias
FROM salon_professionals sp
JOIN users u ON sp.professional_id = u.id
JOIN categories c ON c.id = ANY(u.categories)
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
  AND sp.status = 'accepted'
  AND u.categories IS NOT NULL
  AND array_length(u.categories, 1) > 0;
