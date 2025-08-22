-- =====================================================
-- DIAGNÓSTICO ESPECÍFICO: SALÃO DO RODRIGO
-- =====================================================

-- ID do salão: 18e3a823-b280-4b75-9518-c01ed31fa197
-- Owner: e4fe20f9-fec8-483f-86cc-5cf6f1106942

-- =====================================================
-- 1. VERIFICAR PROFISSIONAIS VINCULADOS AO SALÃO
-- =====================================================

SELECT 
    'PROFISSIONAIS VINCULADOS' as tipo,
    sp.salon_id,
    sp.professional_id,
    sp.status,
    u.name as nome_profissional,
    u.email as email_profissional,
    sp.created_at
FROM salon_professionals sp
JOIN users u ON sp.professional_id = u.id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
ORDER BY sp.status, u.name;

-- =====================================================
-- 2. VERIFICAR HABILIDADES DOS PROFISSIONAIS ACEITOS
-- =====================================================

SELECT 
    'HABILIDADES DOS PROFISSIONAIS' as tipo,
    u.name as nome_profissional,
    us.skill_id,
    s.name as nome_habilidade,
    c.name as categoria,
    us.created_at
FROM salon_professionals sp
JOIN users u ON sp.professional_id = u.id
JOIN user_skills us ON u.id = us.user_id
JOIN skills s ON us.skill_id = s.id
LEFT JOIN categories c ON s.category_id = c.id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
  AND sp.status = 'accepted'
ORDER BY u.name, c.name, s.name;

-- =====================================================
-- 3. VERIFICAR ESTRUTURA DAS TABELAS
-- =====================================================

SELECT 
    'ESTRUTURA TABELAS' as tipo,
    'salon_professionals' as tabela,
    COUNT(*) as total_registros
FROM salon_professionals
UNION ALL
SELECT 
    'ESTRUTURA TABELAS',
    'user_skills',
    COUNT(*)
FROM user_skills
UNION ALL
SELECT 
    'ESTRUTURA TABELAS',
    'skills',
    COUNT(*)
FROM skills
UNION ALL
SELECT 
    'ESTRUTURA TABELAS',
    'categories',
    COUNT(*)
FROM categories;

-- =====================================================
-- 4. TESTE COMPLETO - RESULTADO FINAL
-- =====================================================

WITH profissionais_aceitos AS (
    SELECT professional_id
    FROM salon_professionals
    WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
      AND status = 'accepted'
),
habilidades_agrupadas AS (
    SELECT 
        s.id as skill_id,
        s.name as skill_name,
        c.name as category_name,
        COUNT(DISTINCT us.user_id) as profissionais_count
    FROM user_skills us
    JOIN skills s ON us.skill_id = s.id
    LEFT JOIN categories c ON s.category_id = c.id
    WHERE us.user_id IN (SELECT professional_id FROM profissionais_aceitos)
    GROUP BY s.id, s.name, c.name
)
SELECT 
    'RESULTADO FINAL' as tipo,
    skill_id,
    skill_name,
    COALESCE(category_name, 'Sem categoria') as category_name,
    profissionais_count
FROM habilidades_agrupadas
ORDER BY profissionais_count DESC, category_name, skill_name;

-- =====================================================
-- 5. VERIFICAR SE HÁ PROBLEMAS DE DADOS
-- =====================================================

-- Verificar skills sem categoria
SELECT 
    'SKILLS SEM CATEGORIA' as tipo,
    id,
    name,
    category_id
FROM skills
WHERE category_id IS NULL;

-- Verificar user_skills órfãos
SELECT 
    'USER_SKILLS ORFÃS' as tipo,
    us.user_id,
    us.skill_id,
    s.name as skill_name
FROM user_skills us
LEFT JOIN skills s ON us.skill_id = s.id
WHERE s.id IS NULL;


