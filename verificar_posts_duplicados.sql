-- Verificar posts duplicados por ID
SELECT 
  id,
  title,
  post_type,
  created_at,
  COUNT(*) as quantidade
FROM posts 
WHERE is_active = true
GROUP BY id, title, post_type, created_at
HAVING COUNT(*) > 1
ORDER BY created_at DESC;

-- Verificar posts com títulos similares
SELECT 
  title,
  COUNT(*) as quantidade,
  STRING_AGG(id, ', ') as ids
FROM posts 
WHERE is_active = true
GROUP BY title
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- Verificar se há posts com IDs duplicados
SELECT 
  id,
  COUNT(*) as quantidade
FROM posts 
WHERE is_active = true
GROUP BY id
HAVING COUNT(*) > 1;

-- Listar todos os posts ativos para verificar
SELECT 
  id,
  title,
  post_type,
  created_at,
  updated_at
FROM posts 
WHERE is_active = true
ORDER BY created_at DESC;
