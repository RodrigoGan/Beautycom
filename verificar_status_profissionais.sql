-- Verificar e corrigir status dos profissionais

-- 1. Verificar a estrutura da coluna status
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'salon_professionals' 
AND column_name = 'status';

-- 2. Verificar todos os profissionais e seus status
SELECT 
  sp.id,
  sp.salon_id,
  sp.professional_id,
  sp.status,
  sp.created_at,
  u.name as professional_name,
  s.name as salon_name
FROM salon_professionals sp
JOIN users u ON sp.professional_id = u.id
JOIN salons_studios s ON sp.salon_id = s.id
ORDER BY sp.created_at DESC;

-- 3. Verificar se há status inválidos ou nulos
SELECT 
  status,
  COUNT(*) as total
FROM salon_professionals 
GROUP BY status
ORDER BY total DESC;

-- 4. Verificar profissionais com status 'pending' que deveriam ser 'accepted'
SELECT 
  sp.id,
  sp.salon_id,
  sp.professional_id,
  sp.status,
  u.name as professional_name,
  s.name as salon_name
FROM salon_professionals sp
JOIN users u ON sp.professional_id = u.id
JOIN salons_studios s ON sp.salon_id = s.id
WHERE sp.status = 'pending'
ORDER BY sp.created_at DESC;

-- 5. Se necessário, corrigir status de profissionais que aceitaram convites
-- (Execute apenas se você tiver certeza de que o profissional aceitou)
-- UPDATE salon_professionals 
-- SET status = 'accepted' 
-- WHERE id = 'ID_DO_PROFISSIONAL_AQUI' 
-- AND status = 'pending';

-- 6. Verificar se há constraints na coluna status
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'salon_professionals' 
  AND kcu.column_name = 'status';

-- 7. Verificar se há check constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'salon_professionals'::regclass 
  AND contype = 'c';



