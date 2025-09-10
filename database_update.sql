-- =====================================================
-- ATUALIZAÇÃO DO BANCO DE DADOS BEAUTYCOM
-- =====================================================

-- HABILITAR EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ATUALIZAR TABELA USERS
-- =====================================================

-- Adicionar campos do cadastro (Etapa 1)
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('usuario', 'profissional'));

-- Adicionar campos de endereço (Etapa 2)
ALTER TABLE users ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS logradouro TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS uf TEXT;

-- Adicionar array de categorias (Etapa 3)
ALTER TABLE users ADD COLUMN IF NOT EXISTS categories UUID[] DEFAULT '{}';

-- Criar índice único para nickname
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname) WHERE nickname IS NOT NULL;

-- =====================================================
-- 2. CRIAR TABELA CATEGORIES (HIERÁRQUICA)
-- =====================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- =====================================================
-- 3. INSERIR CATEGORIAS INICIAIS
-- =====================================================

-- Categorias Pai (Level 1)
INSERT INTO categories (name, description, icon, color, level, sort_order) VALUES
('Cabelos Femininos', 'Serviços especializados para cabelos femininos', '👩‍🦰', '#FF69B4', 1, 1),
('Cabelos Masculinos', 'Serviços especializados para cabelos masculinos', '👨‍🦱', '#4169E1', 1, 2),
('Maquiagem', 'Técnicas e produtos de maquiagem', '💄', '#FF1493', 1, 3),
('Unhas', 'Cuidados e decoração de unhas', '💅', '#FF69B4', 1, 4),
('Barba', 'Cuidados e modelagem de barba', '🧔', '#8B4513', 1, 5),
('Estética Facial', 'Tratamentos faciais e limpeza de pele', '✨', '#FFD700', 1, 6),
('Estética Corporal', 'Tratamentos corporais e massagens', '💪', '#32CD32', 1, 7),
('Sobrancelhas', 'Design e modelagem de sobrancelhas', '👁️', '#800080', 1, 8),
('Tatuagem', 'Técnicas de tatuagem e piercings', '🎨', '#000000', 1, 9),
('Depilação', 'Técnicas de depilação', '🪒', '#FF4500', 1, 10);

-- Categorias Filho (Level 2) - Exemplos para algumas categorias
INSERT INTO categories (name, description, icon, color, parent_id, level, sort_order) VALUES
-- Cabelos Femininos
('Cabelos Louros', 'Especialização em cabelos louros', '💛', '#FFD700', (SELECT id FROM categories WHERE name = 'Cabelos Femininos'), 2, 1),
('Penteados', 'Criação de penteados especiais', '💇‍♀️', '#FF69B4', (SELECT id FROM categories WHERE name = 'Cabelos Femininos'), 2, 2),
('Coloração', 'Técnicas de coloração', '🎨', '#FF1493', (SELECT id FROM categories WHERE name = 'Cabelos Femininos'), 2, 3),
('Trança', 'Técnicas de trança', '👧', '#8B4513', (SELECT id FROM categories WHERE name = 'Cabelos Femininos'), 2, 4),

-- Maquiagem
('Maquiagem Social', 'Maquiagem para eventos sociais', '👗', '#FF1493', (SELECT id FROM categories WHERE name = 'Maquiagem'), 2, 1),
('Maquiagem Artística', 'Maquiagem artística e criativa', '🎭', '#FF69B4', (SELECT id FROM categories WHERE name = 'Maquiagem'), 2, 2),
('Maquiagem de Noiva', 'Maquiagem especial para noivas', '👰', '#FFD700', (SELECT id FROM categories WHERE name = 'Maquiagem'), 2, 3),

-- Unhas
('Unhas Acrílicas', 'Aplicação de unhas acrílicas', '💎', '#FF69B4', (SELECT id FROM categories WHERE name = 'Unhas'), 2, 1),
('Nail Art', 'Decoração artística de unhas', '🎨', '#FF1493', (SELECT id FROM categories WHERE name = 'Unhas'), 2, 2),
('Unhas de Gel', 'Aplicação de unhas de gel', '💅', '#FFD700', (SELECT id FROM categories WHERE name = 'Unhas'), 2, 3);

-- =====================================================
-- 4. CRIAR FUNÇÕES ÚTEIS
-- =====================================================

-- Função para buscar categorias de um usuário
CREATE OR REPLACE FUNCTION get_user_categories(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  icon TEXT,
  color TEXT,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.description, c.icon, c.color, c.level
  FROM categories c
  WHERE c.id = ANY(
    SELECT unnest(categories) FROM users WHERE id = user_uuid
  )
  ORDER BY c.sort_order, c.name;
END;
$$ LANGUAGE plpgsql;

-- Função para adicionar categoria ao usuário
CREATE OR REPLACE FUNCTION add_user_category(user_uuid UUID, category_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users 
  SET categories = array_append(categories, category_uuid)
  WHERE id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função para remover categoria do usuário
CREATE OR REPLACE FUNCTION remove_user_category(user_uuid UUID, category_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users 
  SET categories = array_remove(categories, category_uuid)
  WHERE id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Políticas para categories
CREATE POLICY "Categories são visíveis para todos" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Apenas admins podem modificar categories" ON categories
  FOR ALL USING (auth.role() = 'admin');

-- =====================================================
-- 6. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para consultas comuns
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_categories ON users USING GIN(categories);

-- =====================================================
-- 7. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE categories IS 'Tabela hierárquica de categorias de serviços/preferências';
COMMENT ON COLUMN users.categories IS 'Array de UUIDs das categorias selecionadas pelo usuário';
COMMENT ON COLUMN categories.parent_id IS 'Referência para categoria pai (auto-relacionamento)';
COMMENT ON COLUMN categories.level IS 'Nível na hierarquia: 1=pai, 2=filho, 3=neto';

-- =====================================================
-- FIM DO SCRIPT
-- ===================================================== 