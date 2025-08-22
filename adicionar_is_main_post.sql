-- =====================================================
-- ADICIONAR COLUNA is_main_post NA TABELA POSTS
-- =====================================================

-- Adicionar coluna is_main_post se não existir
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_main_post BOOLEAN DEFAULT false;

-- Criar índice para otimizar consultas por is_main_post
CREATE INDEX IF NOT EXISTS idx_posts_is_main_post ON posts(is_main_post) WHERE is_main_post = true;

-- Verificar se a coluna foi adicionada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND column_name = 'is_main_post';

-- Verificar se há posts principais existentes
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN is_main_post = true THEN 1 END) as posts_principais,
    COUNT(CASE WHEN is_main_post = false OR is_main_post IS NULL THEN 1 END) as posts_normais
FROM posts;

-- =====================================================
-- VERIFICAR ESTRUTURA ATUAL DA TABELA POSTS
-- =====================================================

-- Mostrar todas as colunas da tabela posts
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;



