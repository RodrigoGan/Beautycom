-- Script 5: Corrigir vínculos existentes (execute após os outros scripts)
-- Este script adiciona vínculos para todos os salões que foram criados antes das tabelas existirem

-- Primeiro, vamos verificar quais salões não têm vínculo na tabela salon_professionals
SELECT 
    s.id as salon_id,
    s.name as salon_name,
    s.owner_id as owner_id,
    u.name as owner_name,
    u.user_type as owner_type,
    CASE 
        WHEN sp.id IS NULL THEN 'SEM VÍNCULO'
        ELSE 'COM VÍNCULO'
    END as status_vinculo
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
LEFT JOIN salon_professionals sp ON sp.salon_id = s.id AND sp.professional_id = s.owner_id
ORDER BY s.created_at;

-- Agora vamos adicionar vínculos para todos os salões que não têm
INSERT INTO salon_professionals (salon_id, professional_id, status)
SELECT 
    s.id as salon_id,
    s.owner_id as professional_id,
    'accepted' as status
FROM salons_studios s
LEFT JOIN salon_professionals sp ON sp.salon_id = s.id AND sp.professional_id = s.owner_id
WHERE sp.id IS NULL  -- Apenas salões sem vínculo
  AND s.owner_id IS NOT NULL  -- Garantir que tem owner_id
ON CONFLICT (salon_id, professional_id) DO NOTHING;

-- Verificar o resultado final
SELECT 
    s.id as salon_id,
    s.name as salon_name,
    s.owner_id as owner_id,
    u.name as owner_name,
    u.user_type as owner_type,
    sp.status as vinculo_status,
    sp.created_at as vinculo_criado_em
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
LEFT JOIN salon_professionals sp ON sp.salon_id = s.id AND sp.professional_id = s.owner_id
ORDER BY s.created_at;

-- Contar quantos vínculos foram criados
SELECT 
    COUNT(*) as total_saloes,
    COUNT(sp.id) as total_vinculos,
    COUNT(*) - COUNT(sp.id) as saloes_sem_vinculo
FROM salons_studios s
LEFT JOIN salon_professionals sp ON sp.salon_id = s.id AND sp.professional_id = s.owner_id;



