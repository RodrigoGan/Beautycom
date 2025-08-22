-- Script para verificar usuário rodrigo_gan@hotmail.com
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se existe no auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  encrypted_password
FROM auth.users
WHERE email = 'rodrigo_gan@hotmail.com';

-- 2. Verificar se existe na tabela users
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

-- 3. Se não existir no auth.users, você precisa criar:
-- Vá para Authentication > Users > Add User
-- Email: rodrigo_gan@hotmail.com
-- Password: 123456
-- ✅ Marque "Auto-confirm user"

-- 4. Depois de criar, verificar se foi criado corretamente
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