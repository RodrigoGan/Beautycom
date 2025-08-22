-- Script para criar usuários no Supabase Auth primeiro
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, vamos criar os usuários no Supabase Auth
-- (Isso deve ser feito via API ou Dashboard do Supabase)

-- 2. Depois, vamos inserir os dados na tabela users usando os IDs reais
-- Vamos usar IDs que já existem ou criar via API

-- Para testar, vamos primeiro verificar quais usuários já existem no auth.users
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 3. Se não houver usuários suficientes, você precisará criar via:
-- - Supabase Dashboard > Authentication > Users > Add User
-- - Ou via API do Supabase

-- 4. Depois de criar os usuários no Auth, execute este script:

-- Primeiro, vamos obter os UUIDs das categorias
WITH category_mapping AS (
  SELECT 
    name,
    id
  FROM categories
  WHERE name IN (
    'Cabelos Femininos',
    'Cabelos Masculinos', 
    'Cuidados com as Unhas',
    'Cuidados com a Barba',
    'Estética Corporal',
    'Estética Facial',
    'Tatuagem',
    'Piercing',
    'Maquiagem',
    'Sobrancelhas/Cílios'
  )
)

-- Inserir dados usando IDs que existem no auth.users
-- Substitua os UUIDs pelos IDs reais dos usuários criados no Auth
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
  'SUBSTITUA_PELO_ID_REAL_1', -- Substitua pelo ID real do auth.users
  'ana.silva@example.com',
  'Ana Silva',
  'professional',
  'ana_silva',
  'profissional',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  '(11) 99999-0001',
  '01234-001',
  'Rua das Flores',
  '100',
  'Sala 1',
  'Centro',
  'São Paulo',
  'SP',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Cabelos Femininos'),
    (SELECT id FROM category_mapping WHERE name = 'Maquiagem')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  'SUBSTITUA_PELO_ID_REAL_2', -- Substitua pelo ID real do auth.users
  'carlos.santos@example.com',
  'Carlos Santos',
  'professional',
  'carlos_santos',
  'profissional',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  '(21) 99999-0002',
  '20000-002',
  'Avenida Rio Branco',
  '200',
  'Loja 5',
  'Centro',
  'Rio de Janeiro',
  'RJ',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Cuidados com a Barba'),
    (SELECT id FROM category_mapping WHERE name = 'Cabelos Masculinos')
  ],
  NOW(),
  NOW();

-- 5. Verificar se funcionou
SELECT 
  u.id,
  u.name,
  u.nickname,
  u.user_type,
  u.role,
  u.cidade,
  u.uf,
  u.categories,
  u.created_at
FROM users u
WHERE u.nickname IN ('ana_silva', 'carlos_santos')
ORDER BY u.created_at DESC; 