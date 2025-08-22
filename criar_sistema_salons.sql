-- Sistema de Salões/Estúdios
-- Execute estes SQLs para implementar o sistema completo

-- 1. Criar tabela de salões/estúdios
CREATE TABLE IF NOT EXISTS salons_studios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    profile_photo TEXT,
    cover_photo TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(255),
    bairro VARCHAR(255),
    cidade VARCHAR(255),
    uf VARCHAR(2),
    social_instagram VARCHAR(255),
    social_facebook VARCHAR(255),
    social_youtube VARCHAR(255),
    social_linkedin VARCHAR(255),
    social_x VARCHAR(255),
    social_tiktok VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_id) -- Um usuário só pode ter um salão/estúdio
);

-- 2. Criar tabela de vínculos profissionais-salão
CREATE TABLE IF NOT EXISTS salon_professionals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES salons_studios(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, professional_id) -- Evita duplicatas
);

-- 3. Comentários para documentação
COMMENT ON TABLE salons_studios IS 'Tabela que armazena dados dos salões/estúdios';
COMMENT ON COLUMN salons_studios.owner_id IS 'ID do usuário proprietário do salão/estúdio';
COMMENT ON COLUMN salons_studios.name IS 'Nome do salão/estúdio';
COMMENT ON COLUMN salons_studios.description IS 'Descrição/bio do salão/estúdio';
COMMENT ON COLUMN salons_studios.profile_photo IS 'URL da foto de perfil do salão/estúdio';
COMMENT ON COLUMN salons_studios.cover_photo IS 'URL da foto de capa do salão/estúdio';

COMMENT ON TABLE salon_professionals IS 'Tabela que registra vínculos entre salões e profissionais';
COMMENT ON COLUMN salon_professionals.salon_id IS 'ID do salão/estúdio';
COMMENT ON COLUMN salon_professionals.professional_id IS 'ID do profissional';
COMMENT ON COLUMN salon_professionals.status IS 'Status do vínculo: pending, accepted, rejected';

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_salons_studios_owner ON salons_studios(owner_id);
CREATE INDEX IF NOT EXISTS idx_salons_studios_city ON salons_studios(cidade, uf);
CREATE INDEX IF NOT EXISTS idx_salon_professionals_salon ON salon_professionals(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_professionals_professional ON salon_professionals(professional_id);
CREATE INDEX IF NOT EXISTS idx_salon_professionals_status ON salon_professionals(status);
CREATE INDEX IF NOT EXISTS idx_salon_professionals_created ON salon_professionals(created_at);

-- 5. Políticas RLS (Row Level Security)
ALTER TABLE salons_studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_professionals ENABLE ROW LEVEL SECURITY;

-- Política para salons_studios: usuários podem ver todos os salões
CREATE POLICY "Users can view all salons" ON salons_studios
    FOR SELECT USING (true);

-- Política para salons_studios: proprietários podem gerenciar seus salões
CREATE POLICY "Owners can manage their salons" ON salons_studios
    FOR ALL USING (auth.uid() = owner_id);

-- Política para salon_professionals: usuários podem ver todos os vínculos
CREATE POLICY "Users can view all salon professionals" ON salon_professionals
    FOR SELECT USING (true);

-- Política para salon_professionals: proprietários de salão podem gerenciar vínculos
CREATE POLICY "Salon owners can manage professionals" ON salon_professionals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM salons_studios 
            WHERE id = salon_professionals.salon_id 
            AND owner_id = auth.uid()
        )
    );

-- Política para salon_professionals: profissionais podem aceitar/rejeitar convites
CREATE POLICY "Professionals can respond to invitations" ON salon_professionals
    FOR UPDATE USING (professional_id = auth.uid());

-- 6. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_salons_studios_updated_at 
    BEFORE UPDATE ON salons_studios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salon_professionals_updated_at 
    BEFORE UPDATE ON salon_professionals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Verificar se as tabelas foram criadas
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('salons_studios', 'salon_professionals')
ORDER BY table_name, column_name;
