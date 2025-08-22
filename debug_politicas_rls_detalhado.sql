-- DEBUG DETALHADO DAS POLÍTICAS RLS
-- Execute este SQL para identificar exatamente qual política está bloqueando

-- 1. Verificar se o auth.uid() está funcionando
SELECT 
  auth.uid() as current_auth_uid,
  auth.email() as current_auth_email,
  auth.role() as current_auth_role;

-- 2. Verificar se o usuário atual existe na tabela users
SELECT 
  u.*,
  CASE 
    WHEN u.id = auth.uid() THEN 'CURRENT_USER'
    ELSE 'OTHER_USER'
  END as user_type
FROM users u 
WHERE u.id = auth.uid();

-- 3. Testar acesso direto ao salão SEM RLS
ALTER TABLE salons_studios DISABLE ROW LEVEL SECURITY;

SELECT 
  'TESTE_SEM_RLS' as teste,
  s.id,
  s.name,
  s.owner_id,
  u.name as owner_name,
  u.email as owner_email,
  CASE 
    WHEN s.owner_id = auth.uid() THEN 'OWNER_MATCH'
    ELSE 'NOT_OWNER'
  END as ownership_check
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
WHERE s.owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942';

-- 4. Reabilitar RLS
ALTER TABLE salons_studios ENABLE ROW LEVEL SECURITY;

-- 5. Testar acesso COM RLS
SELECT 
  'TESTE_COM_RLS' as teste,
  s.id,
  s.name,
  s.owner_id,
  u.name as owner_name,
  u.email as owner_email,
  CASE 
    WHEN s.owner_id = auth.uid() THEN 'OWNER_MATCH'
    ELSE 'NOT_OWNER'
  END as ownership_check
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
WHERE s.owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942';

-- 6. Verificar todas as políticas ativas
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'salons_studios'
ORDER BY policyname;

-- 7. Testar cada política individualmente
-- Política 1: Visualização pública
SELECT 
  'POLITICA_1' as politica,
  COUNT(*) as total_saloes
FROM salons_studios s
WHERE true; -- Esta é a condição da política "viewable by everyone"

-- Política 2: Verificar se o usuário é dono
SELECT 
  'POLITICA_2' as politica,
  COUNT(*) as total_saloes_do_usuario
FROM salons_studios s
WHERE s.owner_id = auth.uid();

-- 8. Verificar se há conflito entre políticas
SELECT 
  'CONFLITO_POLITICAS' as teste,
  s.id,
  s.name,
  s.owner_id,
  auth.uid() as current_user,
  CASE 
    WHEN s.owner_id = auth.uid() THEN 'DEVERIA_TER_ACESSO'
    ELSE 'NAO_DEVERIA_TER_ACESSO'
  END as acesso_esperado
FROM salons_studios s
WHERE s.owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942';



