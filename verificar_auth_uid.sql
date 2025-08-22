-- Verificar exatamente qual ID o auth.uid() está retornando
-- Execute este SQL para diagnosticar o problema de autenticação

-- 1. Verificar o auth.uid() atual
SELECT 
  auth.uid() as current_auth_uid,
  auth.email() as current_auth_email,
  auth.role() as current_auth_role;

-- 2. Verificar se esse ID existe na tabela users
SELECT 
  u.id,
  u.name,
  u.nickname,
  u.email,
  u.user_type,
  CASE 
    WHEN u.id = auth.uid() THEN 'MATCH'
    ELSE 'NO_MATCH'
  END as auth_match
FROM users u 
WHERE u.id = auth.uid();

-- 3. Se não existir, verificar se há algum usuário com email similar
SELECT 
  u.id,
  u.name,
  u.nickname,
  u.email,
  u.user_type
FROM users u 
WHERE u.email = auth.email()
   OR u.email ILIKE '%' || auth.email() || '%';

-- 4. Listar todos os usuários para comparação
SELECT 
  u.id,
  u.name,
  u.nickname,
  u.email,
  u.user_type,
  CASE 
    WHEN u.id = 'e4fe20f9-fec8-483f-86cc-5cf6f1106942' THEN 'RODRIGO_TARGET'
    WHEN u.id = auth.uid() THEN 'CURRENT_AUTH'
    ELSE 'OTHER'
  END as user_type_flag
FROM users u 
ORDER BY u.created_at DESC
LIMIT 10;



