-- Verificar o tipo atual do campo categories
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'categories';

-- Verificar se o campo categories existe e seu tipo
\d users;

-- Se o campo categories não existir ou estiver com tipo errado, criar/corrigir
-- ALTER TABLE users DROP COLUMN IF EXISTS categories;
-- ALTER TABLE users ADD COLUMN categories UUID[];

-- Verificar se há dados no campo categories
SELECT id, name, categories FROM users WHERE categories IS NOT NULL;

-- Verificar as categorias disponíveis
SELECT id, name FROM categories WHERE is_active = true ORDER BY sort_order; 