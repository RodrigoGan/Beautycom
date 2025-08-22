-- =====================================================
-- CRIAR APENAS POLÍTICAS RLS FALTANTES
-- =====================================================

-- Habilitar RLS nas tabelas (caso não esteja habilitado)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA TABELA POSTS (APENAS SE NÃO EXISTIREM)
-- =====================================================

-- Política: Posts são visíveis para todos (apenas posts ativos)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND policyname = 'Posts são visíveis para todos'
    ) THEN
        CREATE POLICY "Posts são visíveis para todos" ON posts
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Política: Usuários autenticados podem criar posts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND policyname = 'Usuários autenticados podem criar posts'
    ) THEN
        CREATE POLICY "Usuários autenticados podem criar posts" ON posts
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Política: Apenas o autor pode editar posts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND policyname = 'Apenas o autor pode editar posts'
    ) THEN
        CREATE POLICY "Apenas o autor pode editar posts" ON posts
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Política: Apenas o autor pode deletar posts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND policyname = 'Apenas o autor pode deletar posts'
    ) THEN
        CREATE POLICY "Apenas o autor pode deletar posts" ON posts
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- POLÍTICAS PARA TABELA POST_LIKES (APENAS SE NÃO EXISTIREM)
-- =====================================================

-- Política: Likes são visíveis para todos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'post_likes' 
        AND policyname = 'Likes são visíveis para todos'
    ) THEN
        CREATE POLICY "Likes são visíveis para todos" ON post_likes
            FOR SELECT USING (true);
    END IF;
END $$;

-- Política: Usuários autenticados podem dar like
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'post_likes' 
        AND policyname = 'Usuários autenticados podem dar like'
    ) THEN
        CREATE POLICY "Usuários autenticados podem dar like" ON post_likes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Política: Apenas quem deu like pode remover
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'post_likes' 
        AND policyname = 'Apenas quem deu like pode remover'
    ) THEN
        CREATE POLICY "Apenas quem deu like pode remover" ON post_likes
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- POLÍTICAS PARA TABELA POST_COMMENTS (APENAS SE NÃO EXISTIREM)
-- =====================================================

-- Política: Comentários ativos são visíveis para todos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'post_comments' 
        AND policyname = 'Comentários ativos são visíveis para todos'
    ) THEN
        CREATE POLICY "Comentários ativos são visíveis para todos" ON post_comments
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Política: Usuários autenticados podem comentar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'post_comments' 
        AND policyname = 'Usuários autenticados podem comentar'
    ) THEN
        CREATE POLICY "Usuários autenticados podem comentar" ON post_comments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Política: Apenas o autor pode editar comentários
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'post_comments' 
        AND policyname = 'Apenas o autor pode editar comentários'
    ) THEN
        CREATE POLICY "Apenas o autor pode editar comentários" ON post_comments
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Política: Apenas o autor pode deletar comentários
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'post_comments' 
        AND policyname = 'Apenas o autor pode deletar comentários'
    ) THEN
        CREATE POLICY "Apenas o autor pode deletar comentários" ON post_comments
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar todas as políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('posts', 'post_likes', 'post_comments')
ORDER BY tablename, policyname; 