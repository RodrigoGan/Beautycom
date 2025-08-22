-- Script para verificar a estrutura completa da tabela users
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura da tabela users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. Verificar constraints da tabela users
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass;

-- 3. Verificar check constraints específicos
SELECT 
  conname,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass 
  AND contype = 'c';

-- 4. Verificar se existe constraint específico para role
SELECT 
  conname,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass 
  AND contype = 'c'
  AND pg_get_constraintdef(oid) LIKE '%role%';

-- 5. Teste simples com apenas um usuário e todos os campos
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
  gen_random_uuid(),
  'teste@example.com',
  'Usuário Teste',
  'authenticated', -- Tentando com 'authenticated' em vez de 'user'
  'teste_usuario',
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

-- 6. Verificar se foi inserido
SELECT 
  id,
  name,
  nickname,
  user_type,
  role,
  email,
  created_at
FROM users
WHERE nickname = 'teste_usuario';

-- 7. Limpar o teste
DELETE FROM users WHERE nickname = 'teste_usuario'; 