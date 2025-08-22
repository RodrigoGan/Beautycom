-- Script para descobrir quais valores são permitidos para o campo role
-- Execute este script no Supabase SQL Editor

-- 1. Verificar a definição exata do constraint users_role_check
SELECT 
  conname,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass 
  AND contype = 'c'
  AND conname = 'users_role_check';

-- 2. Verificar se existem usuários na tabela para ver quais roles são usados
SELECT DISTINCT role FROM users LIMIT 10;

-- 3. Verificar a estrutura da tabela auth.users (tabela padrão do Supabase)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND table_schema = 'auth'
  AND column_name = 'role'
ORDER BY ordinal_position;

-- 4. Tentar inserir com diferentes valores de role
-- Teste 1: sem role (deixar NULL se possível)
INSERT INTO users (
  id,
  email,
  name,
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
  'teste1@example.com',
  'Usuário Teste 1',
  'teste1',
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

-- 5. Verificar se foi inserido
SELECT 
  id,
  name,
  nickname,
  user_type,
  role,
  email,
  created_at
FROM users
WHERE nickname = 'teste1';

-- 6. Limpar o teste
DELETE FROM users WHERE nickname = 'teste1'; 