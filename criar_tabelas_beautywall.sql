-- =====================================================
-- BEAUTYWALL - TABELAS PARA SISTEMA DE POSTS
-- =====================================================

-- 1. TABELA PRINCIPAL DE POSTS
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    post_type TEXT NOT NULL CHECK (post_type IN ('normal', 'before-after', 'video')),
    media_urls JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE LIKES
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 3. TABELA DE COMENTÁRIOS
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para posts
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_active ON posts(is_active) WHERE is_active = true;

-- Índices para likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at);

-- Índices para comentários
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_active ON post_comments(is_active) WHERE is_active = true;

-- =====================================================
-- FUNÇÃO PARA ATUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para posts
CREATE POLICY "Posts são visíveis para todos" ON posts
    FOR SELECT USING (is_active = true);

CREATE POLICY "Usuários autenticados podem criar posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Apenas o autor pode editar posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Apenas o autor pode deletar posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para likes
CREATE POLICY "Likes são visíveis para todos" ON post_likes
    FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem dar like" ON post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Apenas quem deu like pode remover" ON post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para comentários
CREATE POLICY "Comentários ativos são visíveis para todos" ON post_comments
    FOR SELECT USING (is_active = true);

CREATE POLICY "Usuários autenticados podem comentar" ON post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Apenas o autor pode editar comentários" ON post_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Apenas o autor pode deletar comentários" ON post_comments
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Função para contar likes de um post
CREATE OR REPLACE FUNCTION get_post_likes_count(post_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM post_likes
        WHERE post_id = post_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Função para contar comentários de um post
CREATE OR REPLACE FUNCTION get_post_comments_count(post_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM post_comments
        WHERE post_id = post_uuid AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se usuário deu like
CREATE OR REPLACE FUNCTION user_liked_post(post_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1
        FROM post_likes
        WHERE post_id = post_uuid AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS DAS TABELAS
-- =====================================================

COMMENT ON TABLE posts IS 'Tabela principal para posts do BeautyWall';
COMMENT ON COLUMN posts.media_urls IS 'JSONB com URLs das mídias. Estrutura: {"type": "normal", "media": [{"url": "...", "type": "image", "order": 1}]}';
COMMENT ON COLUMN posts.post_type IS 'Tipo do post: normal, before-after, video';

COMMENT ON TABLE post_likes IS 'Tabela para likes dos posts';
COMMENT ON TABLE post_comments IS 'Tabela para comentários dos posts';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('posts', 'post_likes', 'post_comments')
ORDER BY table_name, ordinal_position; 