-- =====================================================
-- POLÍTICAS RLS PARA BEAUTYWALL
-- =====================================================

-- Habilitar RLS nas tabelas (caso não esteja habilitado)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA TABELA POSTS
-- =====================================================

-- Política: Posts são visíveis para todos (apenas posts ativos)
CREATE POLICY "Posts são visíveis para todos" ON posts
    FOR SELECT USING (is_active = true);

-- Política: Usuários autenticados podem criar posts
CREATE POLICY "Usuários autenticados podem criar posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Apenas o autor pode editar posts
CREATE POLICY "Apenas o autor pode editar posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Apenas o autor pode deletar posts
CREATE POLICY "Apenas o autor pode deletar posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA TABELA POST_LIKES
-- =====================================================

-- Política: Likes são visíveis para todos
CREATE POLICY "Likes são visíveis para todos" ON post_likes
    FOR SELECT USING (true);

-- Política: Usuários autenticados podem dar like
CREATE POLICY "Usuários autenticados podem dar like" ON post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Apenas quem deu like pode remover
CREATE POLICY "Apenas quem deu like pode remover" ON post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA TABELA POST_COMMENTS
-- =====================================================

-- Política: Comentários ativos são visíveis para todos
CREATE POLICY "Comentários ativos são visíveis para todos" ON post_comments
    FOR SELECT USING (is_active = true);

-- Política: Usuários autenticados podem comentar
CREATE POLICY "Usuários autenticados podem comentar" ON post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Apenas o autor pode editar comentários
CREATE POLICY "Apenas o autor pode editar comentários" ON post_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Apenas o autor pode deletar comentários
CREATE POLICY "Apenas o autor pode deletar comentários" ON post_comments
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICAÇÃO DAS POLÍTICAS
-- =====================================================

-- Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('posts', 'post_likes', 'post_comments')
ORDER BY tablename, policyname;

-- =====================================================
-- TESTE DAS POLÍTICAS
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('posts', 'post_likes', 'post_comments');

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

/*
POLÍTICAS CRIADAS:

POSTS:
- SELECT: Todos podem ver posts ativos
- INSERT: Apenas usuário autenticado pode criar (user_id = auth.uid())
- UPDATE: Apenas autor pode editar
- DELETE: Apenas autor pode deletar

POST_LIKES:
- SELECT: Todos podem ver likes
- INSERT: Usuário autenticado pode dar like
- DELETE: Apenas quem deu like pode remover

POST_COMMENTS:
- SELECT: Todos podem ver comentários ativos
- INSERT: Usuário autenticado pode comentar
- UPDATE: Apenas autor pode editar
- DELETE: Apenas autor pode deletar
*/ 