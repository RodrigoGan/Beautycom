-- Script para verificar usuários no auth.users e criar um usuário de teste
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuários existentes no auth.users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Verificar se há correspondência entre auth.users e users
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  u.id as user_id,
  u.email as user_email,
  u.name,
  u.role
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
ORDER BY au.created_at DESC;

-- 3. Criar um usuário de teste no auth.users (execute manualmente no Dashboard)
-- Vá para Authentication > Users > Add User
-- Email: teste@beautycom.com
-- Password: 123456
-- Marque "Auto-confirm user"

-- 4. Depois de criar o usuário no auth.users, execute este INSERT:
INSERT INTO users (
  id,
  email,
  name,
  role,
  nickname,
  user_type,
  profile_photo,
  phone,
  cep,
  logradouro,
  numero,
  complemento,
  bairro,
  cidade,
  uf,
  categories,
  created_at,
  updated_at
) 
SELECT 
  au.id,
  au.email,
  'Usuário Teste',
  'client',
  'usuario_teste',
  'usuario',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  '(11) 99999-9999',
  '01234-567',
  'Rua Teste',
  '123',
  'Apto 1',
  'Centro',
  'São Paulo',
  'SP',
  ARRAY[]::uuid[],
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'teste@beautycom.com'
AND NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = au.id
);

-- 5. Verificar se foi criado
SELECT 
  id,
  name,
  nickname,
  user_type,
  role,
  email,
  created_at
FROM users
WHERE email = 'teste@beautycom.com'; 