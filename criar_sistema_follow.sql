-- Sistema de Follow/Unfollow e Privacidade
-- Execute estes SQLs para implementar o sistema completo

-- 1. Criar tabela de follows (quem segue quem)
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- 2. Criar tabela de configurações de privacidade
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    show_following_count BOOLEAN DEFAULT true,
    show_followers_count BOOLEAN DEFAULT true,
    show_following_list BOOLEAN DEFAULT true,
    show_followers_list BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Adicionar colunas de configuração de privacidade na tabela users (alternativa mais simples)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS privacy_show_following BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_show_followers BOOLEAN DEFAULT true;

-- 4. Comentários para documentação
COMMENT ON TABLE user_follows IS 'Tabela que registra quem segue quem';
COMMENT ON COLUMN user_follows.follower_id IS 'ID do usuário que está seguindo';
COMMENT ON COLUMN user_follows.following_id IS 'ID do usuário que está sendo seguido';
COMMENT ON COLUMN users.privacy_show_following IS 'Se o usuário permite que outros vejam quem ele segue';
COMMENT ON COLUMN users.privacy_show_followers IS 'Se o usuário permite que outros vejam quem o segue';

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON user_follows(created_at);

-- 6. Políticas RLS (Row Level Security)
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Política para user_follows: usuários podem ver todos os follows
CREATE POLICY "Users can view all follows" ON user_follows
    FOR SELECT USING (true);

-- Política para user_follows: usuários autenticados podem seguir/deixar de seguir
CREATE POLICY "Authenticated users can manage follows" ON user_follows
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para user_privacy_settings: usuários podem ver suas próprias configurações
CREATE POLICY "Users can view own privacy settings" ON user_privacy_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Política para user_privacy_settings: usuários podem editar suas próprias configurações
CREATE POLICY "Users can edit own privacy settings" ON user_privacy_settings
    FOR ALL USING (auth.uid() = user_id);

-- 7. Verificar se as tabelas foram criadas
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_follows', 'user_privacy_settings')
ORDER BY table_name, column_name;
