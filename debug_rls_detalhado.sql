-- Debug detalhado das políticas RLS e autenticação
-- Execute este SQL para identificar o problema exato

-- 1. Verificar se o auth.uid() está funcionando
SELECT 
  auth.uid() as current_auth_uid,
  auth.email() as current_auth_email,
  auth.role() as current_auth_role;

-- 2. Testar acesso direto ao salão com auth.uid()
SELECT 
  s.*,
  CASE 
    WHEN s.owner_id = auth.uid() THEN 'OWNER_ACCESS'
    ELSE 'NOT_OWNER'
  END as access_type,
  auth.uid() as current_user,
  s.owner_id as salon_owner
FROM salons_studios s
WHERE s.id = '18e3a823-b280-4b75-9518-c01ed31fa197';

-- 3. Verificar se o usuário atual existe na tabela users
SELECT 
  u.*,
  CASE 
    WHEN u.id = auth.uid() THEN 'CURRENT_USER'
    ELSE 'OTHER_USER'
  END as user_type
FROM users u 
WHERE u.id = auth.uid();

-- 4. Testar acesso sem RLS (desabilitar temporariamente)
-- ALTER TABLE salons_studios DISABLE ROW LEVEL SECURITY;
-- SELECT * FROM salons_studios WHERE id = '18e3a823-b280-4b75-9518-c01ed31fa197';
-- ALTER TABLE salons_studios ENABLE ROW LEVEL SECURITY;

-- 5. Verificar políticas ativas da tabela salons_studios
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

-- 6. Testar se o problema é específico do Rodrigo
SELECT 
  'RODRIGO_TEST' as test_type,
  s.id,
  s.name,
  s.owner_id,
  u.name as owner_name,
  CASE 
    WHEN s.owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942' THEN 'RODRIGO_OWNER'
    ELSE 'OTHER_OWNER'
  END as owner_check
FROM salons_studios s
JOIN users u ON u.id = s.owner_id
WHERE s.owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942';



