-- Script final para inserir dados dos mocks no banco de dados
-- Execute este script no Supabase SQL Editor

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
) VALUES 
-- Profissionais
(
  gen_random_uuid(),
  'Ana Silva',
  'ana_silva',
  'profissional',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  'São Paulo',
  'SP',
  ARRAY['deusuc04c-0004-4434-0508-05038234800', 'afb809b8-8bb0-4f98-a000-ad6107d95395'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Carlos Santos',
  'carlos_santos',
  'profissional',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  'Rio de Janeiro',
  'RJ',
  ARRAY['9a93c96d-d6b0-4164-a4e8-2799c00015b3', 'c973242c-cfa4-452e-8627-0c74fc434a99'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Maria Costa',
  'maria_costa',
  'profissional',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
  'Curitiba',
  'PR',
  ARRAY['afb809b8-8bb0-4f98-a000-ad6107d95395', '0d268cac-b876-4305-ad60-450272edb893'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'João Pereira',
  'joao_pereira',
  'profissional',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  'Salvador',
  'BA',
  ARRAY['9a93c96d-d6b0-4164-a4e8-2799c00015b3', 'c973242c-cfa4-452e-8627-0c74fc434a99'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Fernanda Lima',
  'fernanda_lima',
  'profissional',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  'Porto Alegre',
  'RS',
  ARRAY['deusuc04c-0004-4434-0508-05038234800', '0d268cac-b876-4305-ad60-450272edb893'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Roberto Alves',
  'roberto_alves',
  'profissional',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
  'Recife',
  'PE',
  ARRAY['9a93c96d-d6b0-4164-a4e8-2799c00015b3', '0a5058fa-9d71-42bd-bad4-37541ecb89c6'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Patrícia Santos',
  'patricia_santos',
  'profissional',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
  'Manaus',
  'AM',
  ARRAY['afb809b8-8bb0-4f98-a000-ad6107d95395', 'ab3b49b5-49a1-4698-8575-1613b40744f4'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Marcelo Costa',
  'marcelo_costa',
  'profissional',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
  'Goiânia',
  'GO',
  ARRAY['c973242c-cfa4-452e-8627-0c74fc434a99', '9a93c96d-d6b0-4164-a4e8-2799c00015b3'],
  NOW(),
  NOW()
),

-- Salões/Estúdios
(
  gen_random_uuid(),
  'Bella Salon',
  'bella_salon',
  'profissional',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
  'Belo Horizonte',
  'MG',
  ARRAY['965792f1-690f-45f0-943c-0c582b93ccff', 'a07aa8f7-a7ab-486c-bcef-f5fda9103edc', 'deusuc04c-0004-4434-0508-05038234800'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Studio Beauty',
  'studio_beauty',
  'profissional',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop',
  'Brasília',
  'DF',
  ARRAY['965792f1-690f-45f0-943c-0c582b93ccff', 'a07aa8f7-a7ab-486c-bcef-f5fda9103edc', 'deusuc04c-0004-4434-0508-05038234800'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Beauty Studio',
  'beauty_studio',
  'profissional',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
  'Fortaleza',
  'CE',
  ARRAY['1269dc24-5ab1-4fb5-a20c-a6adb308b30d', '965792f1-690f-45f0-943c-0c582b93ccff', 'deusuc04c-0004-4434-0508-05038234800'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Elite Beauty',
  'elite_beauty',
  'profissional',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop',
  'Campo Grande',
  'MS',
  ARRAY['a07aa8f7-a7ab-486c-bcef-f5fda9103edc', 'deusuc04c-0004-4434-0508-05038234800', 'afb809b8-8bb0-4f98-a000-ad6107d95395'],
  NOW(),
  NOW()
),

-- Usuários
(
  gen_random_uuid(),
  'Juliana Santos',
  'juliana_santos',
  'usuario',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  'Florianópolis',
  'SC',
  ARRAY['afb809b8-8bb0-4f98-a000-ad6107d95395', 'a07aa8f7-a7ab-486c-bcef-f5fda9103edc'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Rafael Costa',
  'rafael_costa',
  'usuario',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
  'Vitória',
  'ES',
  ARRAY['9a93c96d-d6b0-4164-a4e8-2799c00015b3', 'c973242c-cfa4-452e-8627-0c74fc434a99'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Amanda Silva',
  'amanda_silva',
  'usuario',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  'Maceió',
  'AL',
  ARRAY['965792f1-690f-45f0-943c-0c582b93ccff', '0d268cac-b876-4305-ad60-450272edb893'],
  NOW(),
  NOW()
);

-- Verificar se os dados foram inseridos corretamente
SELECT 
  id,
  name,
  nickname,
  user_type,
  cidade,
  uf,
  categories,
  created_at
FROM users 
WHERE nickname IN (
  'ana_silva', 'carlos_santos', 'maria_costa', 'joao_pereira',
  'fernanda_lima', 'roberto_alves', 'patricia_santos', 'marcelo_costa',
  'bella_salon', 'studio_beauty', 'beauty_studio', 'elite_beauty',
  'juliana_santos', 'rafael_costa', 'amanda_silva'
)
ORDER BY created_at DESC; 