-- Script 4: Adicionar vínculo manual para o Rodrigo (execute após os outros scripts)
-- Este script adiciona o vínculo entre o Rodrigo Gandolpho e o salão "Barbearia do Rodrigo"

-- Primeiro, vamos encontrar o ID do Rodrigo Gandolpho
-- SELECT id, name, user_type FROM users WHERE name ILIKE '%Rodrigo%' AND user_type = 'profissional';

-- Depois, vamos encontrar o ID do salão "Barbearia do Rodrigo"
-- SELECT id, name, owner_id FROM salons_studios WHERE name ILIKE '%Barbearia do Rodrigo%';

-- Agora vamos adicionar o vínculo (substitua os UUIDs pelos valores reais encontrados acima)
-- Exemplo (substitua pelos IDs reais):
-- INSERT INTO salon_professionals (salon_id, professional_id, status) 
-- VALUES ('UUID_DO_SALAO', 'UUID_DO_RODRIGO', 'accepted')
-- ON CONFLICT (salon_id, professional_id) DO NOTHING;

-- Para facilitar, vamos fazer uma inserção automática baseada no nome:
INSERT INTO salon_professionals (salon_id, professional_id, status)
SELECT 
    s.id as salon_id,
    u.id as professional_id,
    'accepted' as status
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
WHERE s.name ILIKE '%Barbearia do Rodrigo%'
  AND u.name ILIKE '%Rodrigo%'
  AND u.user_type = 'profissional'
ON CONFLICT (salon_id, professional_id) DO NOTHING;

-- Verificar se o vínculo foi criado
SELECT 
    sp.id,
    sp.salon_id,
    sp.professional_id,
    sp.status,
    s.name as salon_name,
    u.name as professional_name
FROM salon_professionals sp
JOIN salons_studios s ON s.id = sp.salon_id
JOIN users u ON u.id = sp.professional_id
WHERE s.name ILIKE '%Barbearia do Rodrigo%';



