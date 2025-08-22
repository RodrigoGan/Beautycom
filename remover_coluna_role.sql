-- =====================================================
-- REMOVER COLUNA ROLE DA TABELA USERS
-- =====================================================

-- 1. Verificar se a coluna role existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'role';

-- 2. Verificar se há dados na coluna role antes de remover
SELECT COUNT(*) as total_usuarios,
       COUNT(CASE WHEN role = 'professional' THEN 1 END) as profissionais,
       COUNT(CASE WHEN role = 'client' THEN 1 END) as clientes
FROM users;

-- 3. Verificar se user_type tem os mesmos dados
SELECT COUNT(*) as total_usuarios,
       COUNT(CASE WHEN user_type = 'profissional' THEN 1 END) as profissionais,
       COUNT(CASE WHEN user_type = 'usuario' THEN 1 END) as usuarios
FROM users;

-- 4. Verificar se há inconsistências entre role e user_type
SELECT id, name, role, user_type
FROM users 
WHERE (role = 'professional' AND user_type != 'profissional')
   OR (role = 'client' AND user_type != 'usuario');

-- 5. REMOVER A COLUNA ROLE
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- 6. Verificar se a coluna foi removida
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 7. Verificar se os dados em user_type estão corretos
SELECT user_type, COUNT(*) as quantidade
FROM users 
GROUP BY user_type 
ORDER BY user_type;








