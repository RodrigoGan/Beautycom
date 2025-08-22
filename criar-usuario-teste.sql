-- Script para criar um usuário de teste simples
-- Execute este script no Supabase Dashboard > SQL Editor

-- Primeiro, vamos verificar se já existe um usuário de teste
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'teste@beautycom.com';

-- Se não existir, crie o usuário via Dashboard:
-- 1. Vá para Authentication > Users
-- 2. Clique em "Add User"
-- 3. Preencha:
--    - Email: teste@beautycom.com
--    - Password: 123456
-- 4. Clique em "Create User"

-- Depois, insira os dados na tabela users:
INSERT INTO users (
  id,
  email,
  name,
  nickname,
  user_type,
  role,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'teste@beautycom.com'),
  'teste@beautycom.com',
  'Usuário de Teste',
  'teste',
  'usuario',
  'client',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  nickname = EXCLUDED.nickname,
  user_type = EXCLUDED.user_type,
  updated_at = NOW();

-- Verificar se foi criado corretamente
SELECT * FROM users WHERE email = 'teste@beautycom.com'; 