-- Script para listar todos os usuários disponíveis
-- Execute este script no Supabase SQL Editor

-- 1. Listar todos os usuários na tabela users
SELECT 
  id,
  name,
  nickname,
  user_type,
  role,
  email,
  created_at
FROM users
ORDER BY created_at DESC;

-- 2. Verificar quais têm correspondência no auth.users
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.user_type,
  CASE 
    WHEN au.id IS NOT NULL THEN '✅ Existe no auth.users'
    ELSE '❌ Não existe no auth.users'
  END as auth_status
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC;

-- 3. Listar apenas usuários que existem no auth.users
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.user_type,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM users u
INNER JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC; 