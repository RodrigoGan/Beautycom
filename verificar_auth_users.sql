-- Verificar todos os usuários no auth.users
-- Execute este script no Supabase Dashboard > SQL Editor

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  role
FROM auth.users
ORDER BY created_at DESC;

-- Verificar se existe algum usuário com email de teste
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email IN ('teste@beautycom.com', 'rodrigo_gan@hotmail.com');

-- Verificar configurações de autenticação
SELECT 
  name,
  value
FROM auth.config
WHERE name IN ('enable_signup', 'enable_email_confirmation', 'enable_email_change'); 