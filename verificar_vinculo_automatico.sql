-- Verificar se o vínculo automático foi criado
-- Substitua o UUID do Rodrigo: e4fe20f9-fec8-483f-86cc-5cf6f1106942

-- 1. Verificar se o salão existe
SELECT 'SALÃO' as tipo, s.id, s.name, s.owner_id, s.created_at
FROM salons_studios s
WHERE s.owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
ORDER BY s.created_at DESC;

-- 2. Verificar se o vínculo profissional foi criado
SELECT 'VÍNCULO PROFISSIONAL' as tipo, sp.*, u.name as professional_name, u.nickname
FROM salon_professionals sp
JOIN users u ON u.id = sp.professional_id
WHERE sp.professional_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942'
ORDER BY sp.created_at DESC;

-- 3. Verificar todos os vínculos do salão "Barbearia do Rodrigo"
SELECT 'TODOS OS VÍNCULOS' as tipo, sp.*, u.name as professional_name, u.nickname
FROM salon_professionals sp
JOIN users u ON u.id = sp.professional_id
WHERE sp.salon_id = '18e3a823-b280-4b75-9518-c01ed31fa197'
ORDER BY sp.created_at DESC;

-- 4. Se não houver vínculo, criar manualmente
-- INSERT INTO salon_professionals (salon_id, professional_id, status)
-- VALUES ('18e3a823-b280-4b75-9518-c01ed31fa197', 'e4fe20f9-fec8-483f-86cc-5cf6f1106942', 'accepted')
-- ON CONFLICT (salon_id, professional_id) DO NOTHING;



