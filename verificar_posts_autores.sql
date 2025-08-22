-- Verificar posts e seus autores
SELECT 
  p.id,
  p.title,
  p.post_type,
  p.user_id,
  u.nickname as author_nickname,
  u.email as author_email,
  p.created_at
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 10;
