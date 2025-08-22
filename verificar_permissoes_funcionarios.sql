-- Verificar permissões dos funcionários
SELECT 
  se.id,
  se.salon_id,
  se.user_id,
  se.role,
  se.status,
  se.permissions,
  u.name as user_name,
  u.nickname,
  s.name as salon_name
FROM salon_employees se
JOIN users u ON se.user_id = u.id
JOIN salons_studios s ON se.salon_id = s.id
WHERE se.status = 'active'
ORDER BY se.created_at DESC;

-- Verificar estrutura da coluna permissions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'salon_employees' 
AND column_name = 'permissions';

-- Verificar se há funcionários com permissões nulas ou vazias
SELECT 
  COUNT(*) as total_funcionarios,
  COUNT(CASE WHEN permissions IS NULL THEN 1 END) as permissoes_nulas,
  COUNT(CASE WHEN permissions = '{}' THEN 1 END) as permissoes_vazias,
  COUNT(CASE WHEN permissions IS NOT NULL AND permissions != '{}' THEN 1 END) as permissoes_validas
FROM salon_employees 
WHERE status = 'active';



