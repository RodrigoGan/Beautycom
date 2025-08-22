-- Verificar os valores únicos de post_type na tabela posts
SELECT DISTINCT post_type, COUNT(*) as quantidade
FROM posts 
WHERE is_active = true
GROUP BY post_type
ORDER BY quantidade DESC;

-- Verificar alguns posts de exemplo com seus tipos
SELECT id, title, post_type, created_at
FROM posts 
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;
