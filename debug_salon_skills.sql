-- DEBUG: Verificar por que as habilidades não estão sendo exibidas no salão

-- 1. Verificar se há profissionais aceitos no salão
SELECT 
  sp.id,
  sp.salon_id,
  sp.professional_id,
  sp.status,
  u.name as professional_name,
  u.nickname
FROM salon_professionals sp
JOIN users u ON sp.professional_id = u.id
WHERE sp.salon_id = 'SEU_SALON_ID_AQUI' -- Substitua pelo ID do salão
  AND sp.status = 'accepted'
ORDER BY sp.created_at DESC;

-- 2. Verificar se os profissionais têm habilidades cadastradas
SELECT 
  us.user_id,
  us.skill_id,
  s.name as skill_name,
  c.name as category_name,
  u.name as professional_name
FROM user_skills us
JOIN skills s ON us.skill_id = s.id
JOIN categories c ON s.category_id = c.id
JOIN users u ON us.user_id = u.id
WHERE us.user_id IN (
  SELECT professional_id 
  FROM salon_professionals 
  WHERE salon_id = 'SEU_SALON_ID_AQUI' -- Substitua pelo ID do salão
    AND status = 'accepted'
)
ORDER BY u.name, c.name, s.name;

-- 3. Verificar a estrutura das tabelas relacionadas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_skills', 'skills', 'categories')
ORDER BY table_name, ordinal_position;

-- 4. Verificar se há dados nas tabelas de habilidades
SELECT 'user_skills' as table_name, COUNT(*) as total_records FROM user_skills
UNION ALL
SELECT 'skills' as table_name, COUNT(*) as total_records FROM skills
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as total_records FROM categories;

-- 5. Verificar foreign keys
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('user_skills', 'skills');

-- 6. Testar a consulta completa que o componente está fazendo
WITH salon_professionals_data AS (
  SELECT professional_id
  FROM salon_professionals
  WHERE salon_id = 'SEU_SALON_ID_AQUI' -- Substitua pelo ID do salão
    AND status = 'accepted'
)
SELECT 
  us.skill_id,
  s.name as skill_name,
  c.name as category_name,
  u.name as professional_name
FROM user_skills us
JOIN skills s ON us.skill_id = s.id
JOIN categories c ON s.category_id = c.id
JOIN users u ON us.user_id = u.id
WHERE us.user_id IN (SELECT professional_id FROM salon_professionals_data)
ORDER BY c.name, s.name;



