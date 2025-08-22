-- =====================================================
-- CRIAR TABELA SALON_MAIN_POSTS
-- =====================================================

-- Tabela para posts principais do salão
CREATE TABLE IF NOT EXISTS salon_main_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES salons_studios(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    priority_order INTEGER NOT NULL CHECK (priority_order >= 1 AND priority_order <= 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que um post não seja principal em mais de um salão
    UNIQUE(post_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_salon_main_posts_salon_id ON salon_main_posts(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_main_posts_post_id ON salon_main_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_salon_main_posts_priority ON salon_main_posts(salon_id, priority_order);

-- RLS para a tabela salon_main_posts
ALTER TABLE salon_main_posts ENABLE ROW LEVEL SECURITY;

-- Política: proprietário do salão pode gerenciar posts principais
CREATE POLICY "Salon owner can manage main posts" ON salon_main_posts
    FOR ALL USING (
        salon_id IN (
            SELECT id FROM salons_studios 
            WHERE owner_id = auth.uid()
        )
    );

-- Política: todos podem ver posts principais
CREATE POLICY "Anyone can view main posts" ON salon_main_posts
    FOR SELECT USING (true);

-- Função para validar limite de 3 posts principais por salão
CREATE OR REPLACE FUNCTION validate_salon_main_posts_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se já existem 3 posts principais para este salão
    IF (SELECT COUNT(*) FROM salon_main_posts WHERE salon_id = NEW.salon_id) >= 3 THEN
        RAISE EXCEPTION 'Limite de 3 posts principais por salão foi atingido';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar limite antes de inserir
CREATE TRIGGER trigger_validate_salon_main_posts_limit
    BEFORE INSERT ON salon_main_posts
    FOR EACH ROW
    EXECUTE FUNCTION validate_salon_main_posts_limit();

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_salon_main_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_salon_main_posts_updated_at
    BEFORE UPDATE ON salon_main_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_salon_main_posts_updated_at();

-- =====================================================
-- VERIFICAR ESTRUTURA CRIADA
-- =====================================================

-- Verificar se a tabela foi criada
SELECT 
    'ESTRUTURA CRIADA' as tipo,
    table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'salon_main_posts'
    ) as existe
FROM (VALUES ('salon_main_posts')) AS t(table_name);

-- Verificar contagem de registros
SELECT 
    'CONTAGEM REGISTROS' as tipo,
    'salon_main_posts' as tabela,
    COUNT(*) as total
FROM salon_main_posts;
