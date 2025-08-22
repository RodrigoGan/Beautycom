-- =====================================================
-- ADICIONAR HABILIDADES AOS PROFISSIONAIS
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
    sp.status
FROM salon_professionals sp
JOIN users u ON sp.professional_id = u.id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
ORDER BY sp.status, u.name;

-- =====================================================
-- 2. VERIFICAR HABILIDADES DISPONÍVEIS
-- =====================================================

SELECT 
    'HABILIDADES DISPONÍVEIS' as tipo,
    s.id as skill_id,
    s.name as skill_name,
    c.name as category_name
FROM skills s
LEFT JOIN categories c ON s.category_id = c.id
ORDER BY c.name, s.name;

-- =====================================================
-- 3. ADICIONAR HABILIDADES AOS PROFISSIONAIS
-- =====================================================

-- Adicionar habilidades ao Rodrigo (owner do salão)
-- Assumindo que ele é um profissional de barbearia

INSERT INTO user_skills (user_id, skill_id) VALUES
    ('e4fe20f9-fec8-483f-86cc-5cf6f1106942', (SELECT id FROM skills WHERE name = 'Corte Masculino')),
    ('e4fe20f9-fec8-483f-86cc-5cf6f1106942', (SELECT id FROM skills WHERE name = 'Barba')),
    ('e4fe20f9-fec8-483f-86cc-5cf6f1106942', (SELECT id FROM skills WHERE name = 'Sobrancelha'))
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- =====================================================
-- 4. VERIFICAR HABILIDADES ADICIONADAS
-- =====================================================

SELECT 
    'HABILIDADES DO RODRIGO' as tipo,
    u.name as nome_profissional,
    s.name as skill_name,
    c.name as category_name,
    us.created_at
FROM user_skills us
JOIN users u ON us.user_id = u.id
JOIN skills s ON us.skill_id = s.id
LEFT JOIN categories c ON s.category_id = c.id
WHERE us.user_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
ORDER BY c.name, s.name;

-- =====================================================
-- 5. TESTE FINAL - HABILIDADES DOS PROFISSIONAIS DO SALÃO
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
-- 6. VERIFICAR SE O COMPONENTE AGORA FUNCIONA
-- =====================================================

-- Esta consulta simula exatamente o que o componente SalonSkills faz
SELECT 
    'SIMULAÇÃO COMPONENTE' as tipo,
    'Profissionais encontrados' as etapa,
    COUNT(*) as total
FROM salon_professionals
WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
  AND status = 'accepted';

SELECT 
    'SIMULAÇÃO COMPONENTE' as tipo,
    'Habilidades encontradas' as etapa,
    COUNT(DISTINCT us.skill_id) as total_habilidades
FROM salon_professionals sp
JOIN user_skills us ON sp.professional_id = us.user_id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
  AND sp.status = 'accepted';


