-- Reverter o owner_id do salão de volta para o Rodrigo (ID correto)
-- Rodrigo Gandolpho: e4fe20f9-fec8-483f-86cc-5cf6f1106942
-- Ricardo Alexandre Gandolpho: 024b73f9-af1a-47e1-aa0c-95a7d0b6dedf

-- 1. Verificar o estado atual
SELECT 
  s.id as salon_id,
  s.name as salon_name,
  s.owner_id as current_owner_id,
  u.name as owner_name,
  u.email as owner_email
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
WHERE s.id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 2. Reverter o owner_id para o Rodrigo
UPDATE salons_studios 
SET owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
WHERE id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 3. Reverter o vínculo profissional para o Rodrigo
UPDATE salon_professionals 
SET professional_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 4. Verificar se foi corrigido
SELECT 
  s.id as salon_id,
  s.name as salon_name,
  s.owner_id as salon_owner_id,
  u.name as owner_name,
  u.nickname as owner_nickname,
  u.email as owner_email,
  sp.professional_id,
  sp.status
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
LEFT JOIN salon_professionals sp ON sp.salon_id = s.id
WHERE s.id = '18e3a823-b280-4b75-9518-c01ed31fa197';



