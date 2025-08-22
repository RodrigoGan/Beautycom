-- Script para inserir o usuário de teste na tabela users
-- Execute este script no Supabase Dashboard > SQL Editor

-- Inserir o usuário de teste na tabela users
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
  'f9e8dd35-8053-4b65-9db8-46019ea702a6', -- ID do usuário criado no auth
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

-- Verificar se foi inserido corretamente
SELECT * FROM users WHERE email = 'teste@beautycom.com'; 