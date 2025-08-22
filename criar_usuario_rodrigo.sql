-- Script para criar usuário rodrigo_gan@hotmail.com no auth.users
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário já existe no auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'rodrigo_gan@hotmail.com';

-- 2. Se não existir, você precisa criar manualmente no Dashboard:
-- Vá para Authentication > Users > Add User
-- Email: rodrigo_gan@hotmail.com
-- Password: 123456
-- ✅ Marque "Auto-confirm user"

-- 3. Depois de criar no auth.users, verificar se os dados já existem na tabela users
SELECT 
  id,
  name,
  nickname,
  user_type,
  role,
  email,
  created_at
FROM users
WHERE email = 'rodrigo_gan@hotmail.com';

-- 4. Se não existir na tabela users, inserir os dados:
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
  'Rodrigo Gandolpho',
  'client',
  'rodrigogandolpho',
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
WHERE au.email = 'rodrigo_gan@hotmail.com'
AND NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = au.id
);

-- 5. Verificar se foi criado corretamente
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  u.id as user_id,
  u.name,
  u.role,
  u.user_type
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email = 'rodrigo_gan@hotmail.com'; 