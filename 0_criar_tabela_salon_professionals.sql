-- Script 0: Criar tabela salon_professionals (execute primeiro)
-- Esta tabela é necessária para vincular profissionais aos salões

-- Criar tabela para vincular profissionais aos salões
CREATE TABLE IF NOT EXISTS salon_professionals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES salons_studios(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, professional_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_salon_professionals_salon_id ON salon_professionals(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_professionals_professional_id ON salon_professionals(professional_id);
CREATE INDEX IF NOT EXISTS idx_salon_professionals_status ON salon_professionals(status);

-- Habilitar RLS
ALTER TABLE salon_professionals ENABLE ROW LEVEL SECURITY;

-- Remover policies existentes se houver
DROP POLICY IF EXISTS "Visualizar profissionais do salão" ON salon_professionals;
DROP POLICY IF EXISTS "Gerenciar profissionais do salão" ON salon_professionals;

-- Criar RLS policies
-- Política para visualizar profissionais (todos podem ver)
CREATE POLICY "Visualizar profissionais do salão" ON salon_professionals
    FOR SELECT USING (true);

-- Política para gerenciar profissionais (dono do salão ou próprio profissional)
CREATE POLICY "Gerenciar profissionais do salão" ON salon_professionals
    FOR ALL USING (
        auth.uid() = professional_id OR 
        auth.uid() IN (
            SELECT owner_id FROM salons_studios WHERE id = salon_id
        )
    );

-- Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_salon_professionals_updated_at ON salon_professionals;

CREATE TRIGGER update_salon_professionals_updated_at 
    BEFORE UPDATE ON salon_professionals
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE salon_professionals IS 'Tabela para vincular profissionais aos salões/estúdios';
COMMENT ON COLUMN salon_professionals.status IS 'Status do vínculo: pending, accepted, rejected';



