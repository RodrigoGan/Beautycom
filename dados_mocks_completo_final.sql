-- Script completo para inserir dados dos mocks no banco de dados
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
  gen_random_uuid(),
  'ana.silva@example.com',
  'Ana Silva',
  'authenticated',
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
  gen_random_uuid(),
  'carlos.santos@example.com',
  'Carlos Santos',
  'authenticated',
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
  NOW()

UNION ALL

SELECT 
  gen_random_uuid(),
  'maria.costa@example.com',
  'Maria Costa',
  'authenticated',
  'maria_costa',
  'profissional',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
  '(41) 99999-0003',
  '80000-003',
  'Rua das Palmeiras',
  '300',
  'Apto 10',
  'Batel',
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
  'joao.pereira@example.com',
  'João Pereira',
  'authenticated',
  'joao_pereira',
  'profissional',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  '(71) 99999-0004',
  '40000-004',
  'Rua do Comércio',
  '400',
  'Loja 2',
  'Pelourinho',
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
  'fernanda.lima@example.com',
  'Fernanda Lima',
  'authenticated',
  'fernanda_lima',
  'profissional',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  '(51) 99999-0005',
  '90000-005',
  'Avenida Borges de Medeiros',
  '500',
  'Sala 15',
  'Centro Histórico',
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
  'roberto.alves@example.com',
  'Roberto Alves',
  'authenticated',
  'roberto_alves',
  'profissional',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
  '(81) 99999-0006',
  '50000-006',
  'Rua da Aurora',
  '600',
  'Loja 8',
  'Boa Vista',
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
  'patricia.santos@example.com',
  'Patrícia Santos',
  'authenticated',
  'patricia_santos',
  'profissional',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
  '(92) 99999-0007',
  '69000-007',
  'Avenida Eduardo Ribeiro',
  '700',
  'Apto 25',
  'Centro',
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
  'marcelo.costa@example.com',
  'Marcelo Costa',
  'authenticated',
  'marcelo_costa',
  'profissional',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
  '(62) 99999-0008',
  '74000-008',
  'Avenida Goiás',
  '800',
  'Loja 12',
  'Setor Central',
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
  'bella.salon@example.com',
  'Bella Salon',
  'authenticated',
  'bella_salon',
  'profissional',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
  '(31) 99999-0009',
  '30000-009',
  'Rua da Bahia',
  '900',
  'Loja 1',
  'Centro',
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
  'studio.beauty@example.com',
  'Studio Beauty',
  'authenticated',
  'studio_beauty',
  'profissional',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop',
  '(61) 99999-0010',
  '70000-010',
  'Avenida Paulista',
  '1000',
  'Sala 30',
  'Asa Sul',
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
  'beauty.studio@example.com',
  'Beauty Studio',
  'authenticated',
  'beauty_studio',
  'profissional',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
  '(85) 99999-0011',
  '60000-011',
  'Avenida Beira Mar',
  '1100',
  'Loja 5',
  'Meireles',
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
  'elite.beauty@example.com',
  'Elite Beauty',
  'authenticated',
  'elite_beauty',
  'profissional',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop',
  '(67) 99999-0012',
  '79000-012',
  'Rua 14 de Julho',
  '1200',
  'Sala 8',
  'Centro',
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
  'juliana.santos@example.com',
  'Juliana Santos',
  'authenticated',
  'juliana_santos',
  'usuario',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  '(48) 99999-0013',
  '88000-013',
  'Rua das Palmeiras',
  '1300',
  'Apto 15',
  'Centro',
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
  'rafael.costa@example.com',
  'Rafael Costa',
  'authenticated',
  'rafael_costa',
  'usuario',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
  '(27) 99999-0014',
  '29000-014',
  'Avenida Paulista',
  '1400',
  'Apto 8',
  'Centro',
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
  'amanda.silva@example.com',
  'Amanda Silva',
  'authenticated',
  'amanda_silva',
  'usuario',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  '(82) 99999-0015',
  '57000-015',
  'Rua do Comércio',
  '1500',
  'Apto 12',
  'Centro',
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
  role,
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