-- Corrigir o owner_id do salão para o ID correto do Rodrigo
-- ID incorreto: e4fe20f9-fec8-483f-86cc-5cf6f1106942
-- ID correto: 024b73f9-af1a-47e1-aa0c-95a7d0b6dedf

-- 1. Verificar o Rodrigo na tabela users
SELECT 
  id,
  name,
  nickname,
  email,
  user_type,
  created_at
FROM users 
WHERE name ILIKE '%Rodrigo%' 
   OR name ILIKE '%Gandolpho%'
   OR email ILIKE '%rodrigo%'
ORDER BY created_at DESC;

-- 2. Verificar o salão atual
SELECT 
  id,
  name,
  owner_id,
  created_at
FROM salons_studios 
WHERE name ILIKE '%Rodrigo%' 
   OR name ILIKE '%Barbearia%';

-- 3. Corrigir o owner_id do salão
UPDATE salons_studios 
SET owner_id = '024b73f9-af1a-47e1-aa0c-95a7d0b6dedf'
WHERE id = '18e3a823-b280-4b75-9518-c01ed31fa197'
  AND owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942';

-- 4. Corrigir o vínculo profissional
UPDATE salon_professionals 
SET professional_id = '024b73f9-af1a-47e1-aa0c-95a7d0b6dedf'
WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
  AND professional_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942';

-- 5. Verificar se foi corrigido
SELECT 
  s.id as salon_id,
  s.name as salon_name,
  s.owner_id as salon_owner_id,
  u.name as owner_name,
  u.nickname as owner_nickname,
  sp.professional_id,
  sp.status
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
LEFT JOIN salon_professionals sp ON sp.salon_id = s.id
WHERE s.id = '18e3a823-b280-4b75-9518-c01ed31fa197';



