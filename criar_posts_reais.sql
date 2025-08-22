-- =====================================================
-- CRIAR POSTS REAIS NO BANCO DE DADOS
-- =====================================================

-- Primeiro, vamos verificar as categorias disponíveis
SELECT id, name FROM categories ORDER BY name;

-- =====================================================
-- INSERIR POSTS REAIS
-- =====================================================

-- Post 1: Ana Silva - Cabelos Femininos
INSERT INTO posts (
    id,
    title,
    description,
    post_type,
    category_id,
    user_id,
    media_urls,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Transformação incrível!',
    'Cliente saiu radiante com esse novo visual! Corte moderno com luzes californiana. O que acharam do resultado? 💫',
    'normal',
    (SELECT id FROM categories WHERE name = 'Cabelos Femininos' LIMIT 1),
    (SELECT id FROM users WHERE email = 'ana.silva@example.com' LIMIT 1),
    '{"type": "normal", "media": [{"url": "https://example.com/post1.jpg", "type": "image", "order": 1}]}',
    true,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
);

-- Post 2: Carlos Barbeiro - Cuidados com a Barba
INSERT INTO posts (
    id,
    title,
    description,
    post_type,
    category_id,
    user_id,
    media_urls,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Barba perfeita!',
    'Degradê na barba + corte social. Cliente ficou muito satisfeito com o resultado! 🔥',
    'normal',
    (SELECT id FROM categories WHERE name = 'Cuidados com a Barba' LIMIT 1),
    (SELECT id FROM users WHERE email = 'carlos.santos@example.com' LIMIT 1),
    '{"type": "normal", "media": [{"url": "https://example.com/post2.jpg", "type": "image", "order": 1}]}',
    true,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '4 hours'
);

-- Post 3: Bella Nails - Cuidados com as Unhas
INSERT INTO posts (
    id,
    title,
    description,
    post_type,
    category_id,
    user_id,
    media_urls,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Nail art delicada',
    'Francesinha com detalhes em dourado. Perfeita para ocasiões especiais! ✨',
    'normal',
    (SELECT id FROM categories WHERE name = 'Cuidados com as Unhas' LIMIT 1),
    (SELECT id FROM users WHERE email = 'bella.salon@example.com' LIMIT 1),
    '{"type": "normal", "media": [{"url": "https://example.com/post3.jpg", "type": "image", "order": 1}]}',
    true,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
);

-- Post 4: Maria Costa - Maquiagem
INSERT INTO posts (
    id,
    title,
    description,
    post_type,
    category_id,
    user_id,
    media_urls,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Maquiagem para festa',
    'Look glamour para aniversário! Base impecável + olho esfumado + batom vermelho. Cliente amou! 💄',
    'normal',
    (SELECT id FROM categories WHERE name = 'Maquiagem' LIMIT 1),
    (SELECT id FROM users WHERE email = 'maria.costa@example.com' LIMIT 1),
    '{"type": "normal", "media": [{"url": "https://example.com/post4.jpg", "type": "image", "order": 1}]}',
    true,
    NOW() - INTERVAL '8 hours',
    NOW() - INTERVAL '8 hours'
);

-- Post 5: João Pereira - Estética Facial
INSERT INTO posts (
    id,
    title,
    description,
    post_type,
    category_id,
    user_id,
    media_urls,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Tratamento facial',
    'Limpeza de pele + hidratação profunda. Resultado: pele radiante e rejuvenescida! ✨',
    'normal',
    (SELECT id FROM categories WHERE name = 'Estética Facial' LIMIT 1),
    (SELECT id FROM users WHERE email = 'joao.pereira@example.com' LIMIT 1),
    '{"type": "normal", "media": [{"url": "https://example.com/post5.jpg", "type": "image", "order": 1}]}',
    true,
    NOW() - INTERVAL '10 hours',
    NOW() - INTERVAL '10 hours'
);

-- Post 6: Fernanda Lima - Sobrancelhas/Cílios
INSERT INTO posts (
    id,
    title,
    description,
    post_type,
    category_id,
    user_id,
    media_urls,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Design de sobrancelhas',
    'Design personalizado + henna + finalização com gel. Sobrancelhas perfeitas! 👁️',
    'normal',
    (SELECT id FROM categories WHERE name = 'Sobrancelhas/Cílios' LIMIT 1),
    (SELECT id FROM users WHERE email = 'fernanda.lima@example.com' LIMIT 1),
    '{"type": "normal", "media": [{"url": "https://example.com/post6.jpg", "type": "image", "order": 1}]}',
    true,
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours'
);

-- Post 7: Rafael Costa - Cabelos Masculinos (Antes e Depois)
INSERT INTO posts (
    id,
    title,
    description,
    post_type,
    category_id,
    user_id,
    media_urls,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Transformação masculina',
    'Corte moderno + hidratação profunda. Cliente ficou irreconhecível! 💪',
    'before-after',
    (SELECT id FROM categories WHERE name = 'Cabelos Masculinos' LIMIT 1),
    (SELECT id FROM users WHERE email = 'rafael.costa@example.com' LIMIT 1),
    '{"type": "before-after", "beforeAfter": {"before": "https://example.com/before1.jpg", "after": "https://example.com/after1.jpg"}}',
    true,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
);

-- Post 8: Juliana Santos - Vídeo
INSERT INTO posts (
    id,
    title,
    description,
    post_type,
    category_id,
    user_id,
    media_urls,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Tutorial de maquiagem',
    'Aprenda a fazer um olho esfumado perfeito em 3 minutos! 🎥',
    'video',
    (SELECT id FROM categories WHERE name = 'Maquiagem' LIMIT 1),
    (SELECT id FROM users WHERE email = 'juliana.santos@example.com' LIMIT 1),
    '{"type": "video", "media": [{"url": "https://example.com/video1.mp4", "type": "video", "order": 1}]}',
    true,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
);

-- Post 9: Roberto Alves - Carrossel
INSERT INTO posts (
    id,
    title,
    description,
    post_type,
    category_id,
    user_id,
    media_urls,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Sessão de fotos completa',
    'Fotografia profissional para portfólio. Cada ângulo conta uma história! 📸',
    'normal',
    (SELECT id FROM categories WHERE name = 'Cabelos Femininos' LIMIT 1),
    (SELECT id FROM users WHERE email = 'roberto.alves@example.com' LIMIT 1),
    '{"type": "normal", "media": [{"url": "https://example.com/carousel1.jpg", "type": "image", "order": 1}, {"url": "https://example.com/carousel2.jpg", "type": "image", "order": 2}, {"url": "https://example.com/carousel3.jpg", "type": "image", "order": 3}]}',
    true,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
);

-- Post 10: Patrícia Santos - Tatuagem
INSERT INTO posts (
    id,
    title,
    description,
    post_type,
    category_id,
    user_id,
    media_urls,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Tatuagem minimalista',
    'Design personalizado com significado especial. Arte na pele! 🎨',
    'normal',
    (SELECT id FROM categories WHERE name = 'Tatuagem' LIMIT 1),
    (SELECT id FROM users WHERE email = 'patricia.santos@example.com' LIMIT 1),
    '{"type": "normal", "media": [{"url": "https://example.com/tattoo1.jpg", "type": "image", "order": 1}]}',
    true,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
);

-- =====================================================
-- VERIFICAR POSTS CRIADOS
-- =====================================================

-- Listar todos os posts criados
SELECT 
    p.id,
    p.title,
    p.description,
    p.post_type,
    c.name as category,
    u.name as author,
    p.created_at
FROM posts p
JOIN categories c ON p.category_id = c.id
JOIN users u ON p.user_id = u.id
WHERE p.is_active = true
ORDER BY p.created_at DESC; 