-- Script de teste simples para verificar a inserção
-- Execute este script primeiro para testar

-- 1. Primeiro, vamos verificar a estrutura da tabela users
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Vamos verificar se as categorias existem
SELECT 
  id,
  name
FROM categories 
ORDER BY name;

-- 3. Teste simples com apenas um usuário
INSERT INTO users (
  id,
  name,
  nickname,
  user_type,
  profile_photo,
  cidade,
  uf,
  categories,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Teste Usuario',
  'teste_usuario',
  'usuario',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  'São Paulo',
  'SP',
  ARRAY[]::uuid[], -- Array vazio para testar
  NOW(),
  NOW()
);

-- 4. Verificar se foi inserido
SELECT 
  id,
  name,
  nickname,
  user_type,
  categories
FROM users 
WHERE nickname = 'teste_usuario'; 