-- =====================================================
-- CRIAR TABELA USER_SKILLS
-- =====================================================

-- Tabela para relacionar usuários com suas habilidades
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que um usuário não tenha a mesma habilidade duplicada
    UNIQUE(user_id, skill_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_created_at ON user_skills(created_at);

-- RLS para a tabela user_skills
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver suas próprias habilidades
CREATE POLICY "Users can view their own skills" ON user_skills
    FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários podem inserir suas próprias habilidades
CREATE POLICY "Users can insert their own skills" ON user_skills
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem atualizar suas próprias habilidades
CREATE POLICY "Users can update their own skills" ON user_skills
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuários podem deletar suas próprias habilidades
CREATE POLICY "Users can delete their own skills" ON user_skills
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_user_skills_updated_at
    BEFORE UPDATE ON user_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_user_skills_updated_at();

-- =====================================================
-- VERIFICAR SE AS TABELAS DEPENDENTES EXISTEM
-- =====================================================

-- Verificar se a tabela skills existe
SELECT 
    'VERIFICAR TABELAS' as tipo,
    'skills' as tabela,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'skills'
    ) as existe;

-- Verificar se a tabela categories existe
SELECT 
    'VERIFICAR TABELAS' as tipo,
    'categories' as tabela,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
    ) as existe;

-- =====================================================
-- CRIAR TABELAS DEPENDENTES SE NÃO EXISTIREM
-- =====================================================

-- Criar tabela categories se não existir
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela skills se não existir
CREATE TABLE IF NOT EXISTS skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que não há skills duplicadas na mesma categoria
    UNIQUE(name, category_id)
);

-- Índices para skills
CREATE INDEX IF NOT EXISTS idx_skills_category_id ON skills(category_id);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);

-- RLS para skills (permitir leitura pública)
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Política: todos podem ver skills
CREATE POLICY "Anyone can view skills" ON skills
    FOR SELECT USING (true);

-- RLS para categories (permitir leitura pública)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Política: todos podem ver categories
CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT USING (true);

-- =====================================================
-- INSERIR DADOS DE EXEMPLO
-- =====================================================

-- Inserir categorias básicas se não existirem
INSERT INTO categories (name, description) VALUES
    ('Cabelo', 'Serviços relacionados ao cabelo'),
    ('Maquiagem', 'Serviços de maquiagem'),
    ('Unhas', 'Serviços de manicure e pedicure'),
    ('Estética', 'Serviços estéticos gerais'),
    ('Barbearia', 'Serviços de barbearia')
ON CONFLICT (name) DO NOTHING;

-- Inserir skills básicas se não existirem
INSERT INTO skills (name, category_id, description) VALUES
    ('Corte Feminino', (SELECT id FROM categories WHERE name = 'Cabelo'), 'Corte de cabelo feminino'),
    ('Corte Masculino', (SELECT id FROM categories WHERE name = 'Cabelo'), 'Corte de cabelo masculino'),
    ('Coloração', (SELECT id FROM categories WHERE name = 'Cabelo'), 'Coloração de cabelo'),
    ('Hidratação', (SELECT id FROM categories WHERE name = 'Cabelo'), 'Hidratação capilar'),
    ('Maquiagem Social', (SELECT id FROM categories WHERE name = 'Maquiagem'), 'Maquiagem para eventos sociais'),
    ('Maquiagem Artística', (SELECT id FROM categories WHERE name = 'Maquiagem'), 'Maquiagem artística'),
    ('Manicure', (SELECT id FROM categories WHERE name = 'Unhas'), 'Manicure'),
    ('Pedicure', (SELECT id FROM categories WHERE name = 'Unhas'), 'Pedicure'),
    ('Depilação', (SELECT id FROM categories WHERE name = 'Estética'), 'Depilação'),
    ('Limpeza de Pele', (SELECT id FROM categories WHERE name = 'Estética'), 'Limpeza de pele'),
    ('Barba', (SELECT id FROM categories WHERE name = 'Barbearia'), 'Fazer barba'),
    ('Sobrancelha', (SELECT id FROM categories WHERE name = 'Estética'), 'Design de sobrancelha')
ON CONFLICT (name, category_id) DO NOTHING;

-- =====================================================
-- VERIFICAR ESTRUTURA CRIADA
-- =====================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    'ESTRUTURA FINAL' as tipo,
    table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = table_name
    ) as existe
FROM (VALUES 
    ('user_skills'),
    ('skills'),
    ('categories')
) AS t(table_name);

-- Verificar contagem de registros
SELECT 
    'CONTAGEM REGISTROS' as tipo,
    'user_skills' as tabela,
    COUNT(*) as total
FROM user_skills
UNION ALL
SELECT 
    'CONTAGEM REGISTROS',
    'skills',
    COUNT(*)
FROM skills
UNION ALL
SELECT 
    'CONTAGEM REGISTROS',
    'categories',
    COUNT(*)
FROM categories;


