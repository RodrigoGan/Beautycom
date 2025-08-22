-- Verificar e criar vínculo manual se necessário
-- ID do salão: 18e3a823-b280-4b75-9518-c01ed31fa197
-- ID do Rodrigo: e4fe20f9-fec8-483f-86cc-5cf6f1106942

-- 1. Verificar se o vínculo já existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM salon_professionals 
      WHERE salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197' 
      AND professional_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
    ) THEN 'VÍNCULO JÁ EXISTE'
    ELSE 'VÍNCULO NÃO EXISTE - CRIANDO...'
  END as status;

-- 2. Se não existir, criar o vínculo
INSERT INTO salon_professionals (salon_id, professional_id, status)
VALUES ('18e3a823-b280-4b75-9518-c01ed31fa197', 'e4fe20f9-fec8-483f-86cc-5cf6f1106942', 'accepted')
ON CONFLICT (salon_id, professional_id) DO NOTHING
RETURNING *;

-- 3. Verificar se foi criado
SELECT 
  sp.*,
  u.name as professional_name,
  u.nickname,
  s.name as salon_name
FROM salon_professionals sp
JOIN users u ON u.id = sp.professional_id
JOIN salons_studios s ON s.id = sp.salon_id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
AND sp.professional_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942';



