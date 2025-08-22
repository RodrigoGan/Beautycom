-- Script para criar um usuário de teste
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos inserir um usuário na tabela auth.users (você precisa fazer isso manualmente no Supabase Dashboard)
-- Vá para Authentication > Users e crie um usuário com:
-- Email: teste@beautycom.com
-- Password: 123456

-- Depois, execute este script para inserir os dados na tabela users:

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
) VALUES (
  'teste-user-id-aqui', -- Substitua pelo ID real do usuário criado no auth.users
  'teste@beautycom.com',
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
);

-- Verificar se foi inserido
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