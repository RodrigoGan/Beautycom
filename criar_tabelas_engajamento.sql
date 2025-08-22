-- Tabela para favoritos
CREATE TABLE post_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Tabela para compartilhamentos
CREATE TABLE post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL, -- 'whatsapp', 'instagram', 'copy_link'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para denúncias de posts
CREATE TABLE post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- 'spam', 'inappropriate', 'fake', 'other'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- Um usuário só pode denunciar um post uma vez
);

-- Tabela para posts ocultos por usuário
CREATE TABLE post_hidden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- Um usuário só pode ocultar um post uma vez
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE post_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hidden ENABLE ROW LEVEL SECURITY;
