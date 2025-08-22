-- Verificar todas as categorias disponíveis
SELECT id, name, created_at
FROM categories
ORDER BY name;

-- Verificar posts com suas categorias
SELECT 
  p.id,
  p.title,
  p.post_type,
  c.name as categoria_nome,
  c.id as categoria_id
FROM posts p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 10;

-- Verificar se há posts sem categoria
SELECT COUNT(*) as posts_sem_categoria
FROM posts p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true AND c.id IS NULL; 