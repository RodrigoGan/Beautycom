-- Verificar se os posts têm user_id válidos
SELECT 
  p.id,
  p.title,
  p.user_id,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Usuário existe'
    ELSE '❌ Usuário não encontrado'
  END as status_usuario,
  u.nickname,
  u.email
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 10;
