-- Script para resetar a senha do usuário rodrigo_gan@hotmail.com
-- Execute este script no Supabase Dashboard > SQL Editor

-- Primeiro, vamos verificar se o usuário existe
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'rodrigo_gan@hotmail.com';

-- Para resetar a senha, você tem duas opções:

-- OPÇÃO 1: Via Supabase Dashboard
-- 1. Vá para Authentication > Users
-- 2. Encontre o usuário rodrigo_gan@hotmail.com
-- 3. Clique nos 3 pontos (...) ao lado do usuário
-- 4. Selecione "Reset password"
-- 5. Digite a nova senha: 123456
-- 6. Clique em "Update"

-- OPÇÃO 2: Via API (requer service_role key)
-- Use a API do Supabase para resetar a senha programaticamente

-- Depois de resetar, teste o login novamente 