-- Verificar o tipo atual do campo categories
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'categories';

-- Se o campo categories não existir, criar com o tipo correto (UUID array)
ALTER TABLE users ADD COLUMN IF NOT EXISTS categories UUID[];

-- Verificar se o campo foi criado corretamente
\d users;

-- Verificar se há dados no campo categories
SELECT id, name, categories FROM users WHERE categories IS NOT NULL;

-- Verificar as categorias disponíveis
SELECT id, name FROM categories WHERE is_active = true ORDER BY sort_order; 