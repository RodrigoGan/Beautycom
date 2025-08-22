-- Script alternativo para inserir dados dos mocks
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos obter os UUIDs das categorias de forma mais segura
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
)
SELECT 
  gen_random_uuid(),
  'Ana Silva',
  'ana_silva',
  'profissional',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
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
  gen_random_uuid(),
  'Carlos Santos',
  'carlos_santos',
  'profissional',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  'Rio de Janeiro',
  'RJ',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Cuidados com a Barba'),
    (SELECT id FROM category_mapping WHERE name = 'Cabelos Masculinos')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'Maria Costa',
  'maria_costa',
  'profissional',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
  'Curitiba',
  'PR',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Maquiagem'),
    (SELECT id FROM category_mapping WHERE name = 'Sobrancelhas/Cílios')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'João Pereira',
  'joao_pereira',
  'profissional',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  'Salvador',
  'BA',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Cuidados com a Barba'),
    (SELECT id FROM category_mapping WHERE name = 'Cabelos Masculinos')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'Fernanda Lima',
  'fernanda_lima',
  'profissional',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  'Porto Alegre',
  'RS',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Cabelos Femininos'),
    (SELECT id FROM category_mapping WHERE name = 'Sobrancelhas/Cílios')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'Roberto Alves',
  'roberto_alves',
  'profissional',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
  'Recife',
  'PE',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Cuidados com a Barba'),
    (SELECT id FROM category_mapping WHERE name = 'Tatuagem')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'Patrícia Santos',
  'patricia_santos',
  'profissional',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
  'Manaus',
  'AM',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Maquiagem'),
    (SELECT id FROM category_mapping WHERE name = 'Piercing')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'Marcelo Costa',
  'marcelo_costa',
  'profissional',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
  'Goiânia',
  'GO',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Cabelos Masculinos'),
    (SELECT id FROM category_mapping WHERE name = 'Cuidados com a Barba')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'Bella Salon',
  'bella_salon',
  'profissional',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
  'Belo Horizonte',
  'MG',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Estética Facial'),
    (SELECT id FROM category_mapping WHERE name = 'Cuidados com as Unhas'),
    (SELECT id FROM category_mapping WHERE name = 'Cabelos Femininos')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'Studio Beauty',
  'studio_beauty',
  'profissional',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop',
  'Brasília',
  'DF',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Estética Facial'),
    (SELECT id FROM category_mapping WHERE name = 'Cuidados com as Unhas'),
    (SELECT id FROM category_mapping WHERE name = 'Cabelos Femininos')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'Beauty Studio',
  'beauty_studio',
  'profissional',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
  'Fortaleza',
  'CE',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Estética Corporal'),
    (SELECT id FROM category_mapping WHERE name = 'Estética Facial'),
    (SELECT id FROM category_mapping WHERE name = 'Cabelos Femininos')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'Elite Beauty',
  'elite_beauty',
  'profissional',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop',
  'Campo Grande',
  'MS',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Cuidados com as Unhas'),
    (SELECT id FROM category_mapping WHERE name = 'Cabelos Femininos'),
    (SELECT id FROM category_mapping WHERE name = 'Maquiagem')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'Juliana Santos',
  'juliana_santos',
  'usuario',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  'Florianópolis',
  'SC',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Maquiagem'),
    (SELECT id FROM category_mapping WHERE name = 'Cuidados com as Unhas')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'Rafael Costa',
  'rafael_costa',
  'usuario',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
  'Vitória',
  'ES',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Cuidados com a Barba'),
    (SELECT id FROM category_mapping WHERE name = 'Cabelos Masculinos')
  ],
  NOW(),
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'Amanda Silva',
  'amanda_silva',
  'usuario',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  'Maceió',
  'AL',
  ARRAY[
    (SELECT id FROM category_mapping WHERE name = 'Estética Facial'),
    (SELECT id FROM category_mapping WHERE name = 'Sobrancelhas/Cílios')
  ],
  NOW(),
  NOW();

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