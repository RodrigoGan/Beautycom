-- Script para verificar configuração de autenticação
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário está confirmado
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado'
    ELSE '❌ Não confirmado'
  END as status
FROM auth.users
WHERE email = 'rodrigo_gan@hotmail.com';

-- 2. Se não estiver confirmado, confirmar manualmente
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'rodrigo_gan@hotmail.com'
AND email_confirmed_at IS NULL;

-- 3. Verificar se foi confirmado
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'rodrigo_gan@hotmail.com';

-- 4. Verificar configurações de autenticação
-- Vá para Authentication > Settings no Dashboard e verifique:
-- - "Enable email confirmations" deve estar desabilitado para desenvolvimento
-- - "Site URL" deve ser http://localhost:8001
-- - "Redirect URLs" deve incluir http://localhost:8001/** 