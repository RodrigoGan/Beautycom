-- Tabela para likes de comentários (OPCIONAL)
-- Descomente se quiser implementar likes em comentários

/*
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Habilitar RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem curtir comentários" ON comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver likes de comentários" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem remover likes de comentários" ON comment_likes
  FOR DELETE USING (auth.uid() = user_id);
*/
