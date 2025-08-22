-- Debug das políticas RLS para salons_studios
-- Execute este SQL para verificar se as políticas estão funcionando

-- 1. Verificar usuário atual
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email;

-- 2. Verificar se o salão existe e é visível
SELECT 
  s.*,
  CASE 
    WHEN s.owner_id = auth.uid() THEN 'OWNER_ACCESS'
    ELSE 'NOT_OWNER'
  END as access_type
FROM salons_studios s
WHERE s.owner_id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942';

-- 3. Testar inserção direta (deve falhar se RLS estiver funcionando)
-- INSERT INTO salons_studios (name, owner_id) VALUES ('TESTE_RLS', auth.uid());

-- 4. Verificar políticas ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'salons_studios';

-- 5. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'salons_studios';



