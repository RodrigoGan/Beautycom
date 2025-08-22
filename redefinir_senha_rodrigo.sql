-- Script para redefinir senha do usuário rodrigo_gan@hotmail.com
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o usuário atual
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'rodrigo_gan@hotmail.com';

-- 2. Para redefinir a senha, você precisa fazer isso manualmente no Dashboard:
-- Vá para Authentication > Users
-- Encontre o usuário rodrigo_gan@hotmail.com
-- Clique no usuário para abrir os detalhes
-- Clique em "Reset password"
-- Defina a nova senha como: 123456

-- 3. Ou você pode criar um novo usuário de teste:
-- Vá para Authentication > Users > Add User
-- Email: teste@beautycom.com
-- Password: 123456
-- ✅ Marque "Auto-confirm user"

-- 4. Depois de redefinir/criar, verificar se está funcionando
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  u.id as user_id,
  u.name,
  u.role,
  u.user_type,
  au.email_confirmed_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email IN ('rodrigo_gan@hotmail.com', 'teste@beautycom.com'); 