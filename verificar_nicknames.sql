-- =====================================================
-- VERIFICAR NICKNAMES DOS USUÁRIOS
-- =====================================================

-- Verificar se os usuários têm nicknames
SELECT 
    id,
    name,
    nickname,
    email
FROM users 
WHERE nickname IS NOT NULL
ORDER BY name;

-- =====================================================
-- ATUALIZAR NICKNAMES FALTANTES
-- =====================================================

-- Adicionar nicknames para usuários que não têm
UPDATE users 
SET nickname = LOWER(REPLACE(name, ' ', ''))
WHERE nickname IS NULL;

-- =====================================================
-- VERIFICAR POSTS COM AUTORES
-- =====================================================

-- Listar posts com nicknames dos autores
SELECT 
    p.id,
    p.title,
    u.name as author_name,
    u.nickname as author_nickname,
    c.name as category
FROM posts p
JOIN users u ON p.user_id = u.id
JOIN categories c ON p.category_id = c.id
ORDER BY p.created_at DESC
LIMIT 5; 