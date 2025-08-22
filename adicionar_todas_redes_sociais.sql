-- Adicionar todas as colunas de redes sociais na tabela users
-- Execute este SQL apenas se as colunas não existirem

-- Instagram
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS social_instagram VARCHAR(255);

-- Facebook
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS social_facebook VARCHAR(255);

-- YouTube
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS social_youtube VARCHAR(255);

-- LinkedIn
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS social_linkedin VARCHAR(255);

-- X (Twitter) - já adicionado
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS social_x VARCHAR(255);

-- TikTok - já adicionado
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS social_tiktok VARCHAR(255);

-- Adicionar comentários para documentação
COMMENT ON COLUMN users.social_instagram IS 'Username do usuário no Instagram';
COMMENT ON COLUMN users.social_facebook IS 'Username do usuário no Facebook';
COMMENT ON COLUMN users.social_youtube IS 'Username do usuário no YouTube';
COMMENT ON COLUMN users.social_linkedin IS 'Username do usuário no LinkedIn';
COMMENT ON COLUMN users.social_x IS 'Username do usuário no X (anteriormente Twitter)';
COMMENT ON COLUMN users.social_tiktok IS 'Username do usuário no TikTok';

-- Verificar todas as colunas de redes sociais
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'social_%'
ORDER BY column_name;
