-- Verificar quais colunas de redes sociais já existem na tabela users
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'social_%'
ORDER BY column_name;
