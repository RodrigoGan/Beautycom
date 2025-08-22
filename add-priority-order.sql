-- Adicionar campo priority_order na tabela posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS priority_order INTEGER;

-- Criar índice para otimizar consultas por priority_order
CREATE INDEX IF NOT EXISTS idx_posts_priority_order ON posts(priority_order) WHERE is_main_post = true;

-- Atualizar posts principais existentes com priority_order baseado em created_at
UPDATE posts 
SET priority_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as row_num
  FROM posts 
  WHERE is_main_post = true
) as subquery
WHERE posts.id = subquery.id AND posts.is_main_post = true;

-- Criar índice único para garantir que priority_order seja único por usuário para posts principais
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_priority_order 
ON posts(user_id, priority_order) 
WHERE is_main_post = true AND priority_order IS NOT NULL;
