-- Adicionar colunas de redes sociais na tabela users
-- X (anteriormente Twitter) e TikTok

-- Adicionar coluna para X (Twitter)
ALTER TABLE users 
ADD COLUMN social_x VARCHAR(255);

-- Adicionar coluna para TikTok
ALTER TABLE users 
ADD COLUMN social_tiktok VARCHAR(255);

-- Adicionar comentários para documentação
COMMENT ON COLUMN users.social_x IS 'Username do usuário no X (anteriormente Twitter)';
COMMENT ON COLUMN users.social_tiktok IS 'Username do usuário no TikTok';

-- Verificar se as colunas foram adicionadas corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('social_x', 'social_tiktok')
ORDER BY column_name;
