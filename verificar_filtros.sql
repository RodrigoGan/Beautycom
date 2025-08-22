-- Verificar posts por tipo
SELECT 
  post_type,
  COUNT(*) as quantidade,
  STRING_AGG(title, ', ') as exemplos
FROM posts 
WHERE is_active = true
GROUP BY post_type
ORDER BY quantidade DESC;

-- Verificar posts de carrossel especificamente
SELECT 
  id,
  title,
  post_type,
  media_urls->>'type' as media_type,
  jsonb_array_length(media_urls->'media') as num_media
FROM posts 
WHERE is_active = true 
  AND post_type = 'carousel'
ORDER BY created_at DESC;

-- Verificar posts de vídeo
SELECT 
  id,
  title,
  post_type,
  media_urls->>'type' as media_type
FROM posts 
WHERE is_active = true 
  AND (post_type = 'video' OR media_urls->>'type' = 'video')
ORDER BY created_at DESC;

-- Verificar posts before-after
SELECT 
  id,
  title,
  post_type,
  media_urls->>'type' as media_type
FROM posts 
WHERE is_active = true 
  AND (post_type = 'before-after' OR media_urls->>'type' = 'before-after')
ORDER BY created_at DESC;
