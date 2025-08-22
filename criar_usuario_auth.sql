-- Script para criar o usuário rodrigo_gan@hotmail.com no auth.users
-- Execute este script no Supabase Dashboard > SQL Editor

-- Primeiro, vamos verificar se o usuário já existe
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'rodrigo_gan@hotmail.com';

-- Se não existir, você precisa criar o usuário via Supabase Dashboard:
-- 1. Vá para Authentication > Users
-- 2. Clique em "Add User"
-- 3. Preencha:
--    - Email: rodrigo_gan@hotmail.com
--    - Password: 123456 (ou a senha que você quer usar)
-- 4. Clique em "Create User"

-- OU use a API do Supabase para criar o usuário programaticamente
-- (isso requer service_role key, não anon key)

-- Depois de criar o usuário, verifique se foi criado:
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'rodrigo_gan@hotmail.com'; 