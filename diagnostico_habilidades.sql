-- =====================================================
-- DIAGNÓSTICO: HABILIDADES DOS PROFISSIONAIS
-- =====================================================

-- Objetivo: Identificar por que as habilidades não aparecem no perfil do salão

-- =====================================================
-- 1. VERIFICAR SALÕES EXISTENTES
-- =====================================================

SELECT 
    'SALÕES' as tipo,
    id,
    name as nome_salao,
    owner_id
FROM salons_studios
ORDER BY created_at DESC;

-- =====================================================
-- 2. VERIFICAR PROFISSIONAIS VINCULADOS
-- =====================================================

-- Substitua 'SEU_SALON_ID' pelo ID do seu salão
SELECT 
    'PROFISSIONAIS VINCULADOS' as tipo,
    sp.salon_id,
    sp.professional_id,
    sp.status,
    u.name as nome_profissional,
    u.email as email_profissional
FROM salon_professionals sp
JOIN users u ON sp.professional_id = u.id
WHERE sp.salon_id = 'SEU_SALON_ID' -- ⚠️ SUBSTITUIR PELO ID DO SEU SALÃO
ORDER BY sp.status, u.name;

-- =====================================================
-- 3. VERIFICAR HABILIDADES DOS PROFISSIONAIS
-- =====================================================

-- Substitua 'SEU_SALON_ID' pelo ID do seu salão
SELECT 
    'HABILIDADES DOS PROFISSIONAIS' as tipo,
    u.name as nome_profissional,
    us.skill_id,
    s.name as nome_habilidade,
    c.name as categoria
FROM salon_professionals sp
JOIN users u ON sp.professional_id = u.id
JOIN user_skills us ON u.id = us.user_id
JOIN skills s ON us.skill_id = s.id
LEFT JOIN categories c ON s.category_id = c.id
WHERE sp.salon_id = 'SEU_SALON_ID' -- ⚠️ SUBSTITUIR PELO ID DO SEU SALÃO
  AND sp.status = 'accepted'
ORDER BY u.name, c.name, s.name;

-- =====================================================
-- 4. VERIFICAR ESTRUTURA DAS TABELAS
-- =====================================================

-- Verificar se as tabelas existem e têm dados
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
-- 5. VERIFICAR DADOS DE EXEMPLO
-- =====================================================

-- Verificar alguns registros de exemplo
SELECT 
    'EXEMPLO USER_SKILLS' as tipo,
    user_id,
    skill_id,
    created_at
FROM user_skills
LIMIT 5;

SELECT 
    'EXEMPLO SKILLS' as tipo,
    id,
    name,
    category_id
FROM skills
LIMIT 5;

SELECT 
    'EXEMPLO CATEGORIES' as tipo,
    id,
    name
FROM categories
LIMIT 5;

-- =====================================================
-- 6. VERIFICAR RELACIONAMENTOS
-- =====================================================

-- Verificar se há skills sem categoria
SELECT 
    'SKILLS SEM CATEGORIA' as tipo,
    id,
    name,
    category_id
FROM skills
WHERE category_id IS NULL;

-- Verificar se há user_skills com skills inexistentes
SELECT 
    'USER_SKILLS ORFÃS' as tipo,
    us.user_id,
    us.skill_id,
    s.name as skill_name
FROM user_skills us
LEFT JOIN skills s ON us.skill_id = s.id
WHERE s.id IS NULL;

-- =====================================================
-- 7. TESTE COMPLETO PARA UM SALÃO ESPECÍFICO
-- =====================================================

-- Execute esta consulta substituindo 'SEU_SALON_ID' pelo ID real do seu salão
WITH profissionais_aceitos AS (
    SELECT professional_id
    FROM salon_professionals
    WHERE salon_id = 'SEU_SALON_ID' -- ⚠️ SUBSTITUIR PELO ID DO SEU SALÃO
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


