-- Script CORRIGIDO para adicionar status 'pending' na tabela salon_employees
-- Este script resolve o problema das políticas RLS que dependem da coluna status

-- 1. PRIMEIRO: Remover políticas RLS que dependem da coluna status
-- Remover políticas da tabela salon_professionals que usam a coluna status
DROP POLICY IF EXISTS "Visualizar profissionais do salão" ON salon_professionals;
DROP POLICY IF EXISTS "Gerenciar profissionais do salão" ON salon_professionals;
DROP POLICY IF EXISTS "Profissional ver próprios dados" ON salon_professionals;
DROP POLICY IF EXISTS "Profissional pode aceitar/rejeitar convites" ON salon_professionals;

-- Remover políticas da tabela salon_employees que usam a coluna status
DROP POLICY IF EXISTS "Visualizar funcionários do salão" ON salon_employees;
DROP POLICY IF EXISTS "Dono pode adicionar funcionários" ON salon_employees;
DROP POLICY IF EXISTS "Dono pode editar funcionários" ON salon_employees;
DROP POLICY IF EXISTS "Dono pode remover funcionários" ON salon_employees;
DROP POLICY IF EXISTS "Gerenciar funcionários do salão" ON salon_employees;
DROP POLICY IF EXISTS "Ver próprios dados" ON salon_employees;
DROP POLICY IF EXISTS "Visualizar funcionários do salão" ON salon_employees;

-- 2. AGORA: Modificar a tabela salon_employees para incluir status 'pending'
ALTER TABLE salon_employees 
ALTER COLUMN status TYPE VARCHAR(20);

-- 3. Adicionar constraint para incluir 'pending' como status válido
ALTER TABLE salon_employees 
DROP CONSTRAINT IF EXISTS salon_employees_status_check;

ALTER TABLE salon_employees 
ADD CONSTRAINT salon_employees_status_check 
CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'rejected'));

-- 4. Atualizar registros existentes para 'active' (funcionários já aceitos)
UPDATE salon_employees 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- 5. Adicionar comentário para documentação
COMMENT ON COLUMN salon_employees.status IS 'Status do funcionário: pending (aguardando aceitação), active (ativo), inactive (inativo), suspended (suspenso), rejected (rejeitado)';

-- 6. RECRIAR as políticas RLS com as novas condições
-- Políticas para salon_professionals
CREATE POLICY "Visualizar profissionais do salão" ON salon_professionals FOR SELECT USING (
    auth.uid() IN (
        -- Dono do salão
        SELECT owner_id FROM salons_studios WHERE id = salon_id
        UNION
        -- Funcionários com permissão para gerenciar profissionais
        SELECT se.user_id FROM salon_employees se
        WHERE se.salon_id = salon_professionals.salon_id 
          AND se.status = 'active'
          AND se.permissions->'manage_service_professionals'->>'view' = 'true'
        UNION
        -- Profissionais aceitos podem ver outros profissionais do mesmo salão
        SELECT professional_id FROM salon_professionals sp2
        WHERE sp2.salon_id = salon_professionals.salon_id 
          AND sp2.status = 'accepted'
    )
);

CREATE POLICY "Gerenciar profissionais do salão" ON salon_professionals FOR ALL USING (
    auth.uid() IN (
        -- Dono do salão
        SELECT owner_id FROM salons_studios WHERE id = salon_id
        UNION
        -- Funcionários com permissão para gerenciar profissionais
        SELECT se.user_id FROM salon_employees se
        WHERE se.salon_id = salon_professionals.salon_id 
          AND se.status = 'active'
          AND se.permissions->'manage_service_professionals'->>'add' = 'true'
    )
);

CREATE POLICY "Profissional ver próprios dados" ON salon_professionals FOR SELECT USING (
    auth.uid() = professional_id
);

CREATE POLICY "Profissional pode aceitar/rejeitar convites" ON salon_professionals FOR UPDATE USING (
    auth.uid() = professional_id
);

-- Políticas para salon_employees
CREATE POLICY "Visualizar funcionários do salão" ON salon_employees FOR SELECT USING (
    auth.uid() IN (
        -- Dono do salão
        SELECT owner_id FROM salons_studios WHERE id = salon_id
        UNION
        -- Funcionários ativos do mesmo salão
        SELECT user_id FROM salon_employees se2
        WHERE se2.salon_id = salon_employees.salon_id 
          AND se2.status = 'active'
    )
);

CREATE POLICY "Dono pode adicionar funcionários" ON salon_employees FOR INSERT WITH CHECK (
    auth.uid() IN (
        SELECT owner_id FROM salons_studios WHERE id = salon_id
    )
);

CREATE POLICY "Dono pode editar funcionários" ON salon_employees FOR UPDATE USING (
    auth.uid() IN (
        SELECT owner_id FROM salons_studios WHERE id = salon_id
    )
);

CREATE POLICY "Dono pode remover funcionários" ON salon_employees FOR DELETE USING (
    auth.uid() IN (
        SELECT owner_id FROM salons_studios WHERE id = salon_id
    )
);

CREATE POLICY "Funcionário pode ver próprios dados" ON salon_employees FOR SELECT USING (
    auth.uid() = user_id
);

CREATE POLICY "Funcionário pode aceitar/rejeitar convites" ON salon_employees FOR UPDATE USING (
    auth.uid() = user_id
);

-- 7. Criar tabela para notificações de convites (opcional, para melhor UX)
CREATE TABLE IF NOT EXISTS salon_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES salons_studios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitation_type VARCHAR(20) NOT NULL CHECK (invitation_type IN ('employee', 'professional')),
    role VARCHAR(50), -- Para funcionários
    service_type VARCHAR(50), -- Para profissionais
    message TEXT, -- Mensagem personalizada do convite
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, user_id, invitation_type)
);

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_salon_invitations_salon_id ON salon_invitations(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_invitations_user_id ON salon_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_salon_invitations_status ON salon_invitations(status);
CREATE INDEX IF NOT EXISTS idx_salon_invitations_type ON salon_invitations(invitation_type);

-- 9. Comentários para documentação
COMMENT ON TABLE salon_invitations IS 'Tabela para gerenciar convites de funcionários e profissionais';
COMMENT ON COLUMN salon_invitations.invitation_type IS 'Tipo de convite: employee (funcionário) ou professional (profissional)';
COMMENT ON COLUMN salon_invitations.role IS 'Cargo do funcionário (apenas para convites de funcionário)';
COMMENT ON COLUMN salon_invitations.service_type IS 'Tipo de serviço do profissional (apenas para convites de profissional)';
COMMENT ON COLUMN salon_invitations.message IS 'Mensagem personalizada do convite';
COMMENT ON COLUMN salon_invitations.status IS 'Status do convite: pending, accepted, rejected, expired';
COMMENT ON COLUMN salon_invitations.expires_at IS 'Data de expiração do convite (30 dias por padrão)';

-- 10. Habilitar RLS na tabela de convites
ALTER TABLE salon_invitations ENABLE ROW LEVEL SECURITY;

-- 11. Políticas RLS para convites
-- Política para visualizar convites (dono do salão e usuário convidado)
DROP POLICY IF EXISTS "Visualizar convites" ON salon_invitations;
CREATE POLICY "Visualizar convites" ON salon_invitations FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
        SELECT owner_id FROM salons_studios WHERE id = salon_id
    )
);

-- Política para criar convites (apenas dono do salão)
DROP POLICY IF EXISTS "Criar convites" ON salon_invitations;
CREATE POLICY "Criar convites" ON salon_invitations FOR INSERT WITH CHECK (
    auth.uid() IN (
        SELECT owner_id FROM salons_studios WHERE id = salon_id
    )
);

-- Política para atualizar convites (dono do salão e usuário convidado)
DROP POLICY IF EXISTS "Atualizar convites" ON salon_invitations;
CREATE POLICY "Atualizar convites" ON salon_invitations FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
        SELECT owner_id FROM salons_studios WHERE id = salon_id
    )
);

-- Política para deletar convites (apenas dono do salão)
DROP POLICY IF EXISTS "Deletar convites" ON salon_invitations;
CREATE POLICY "Deletar convites" ON salon_invitations FOR DELETE USING (
    auth.uid() IN (
        SELECT owner_id FROM salons_studios WHERE id = salon_id
    )
);

-- 12. Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_salon_invitations_updated_at ON salon_invitations;
CREATE TRIGGER update_salon_invitations_updated_at 
    BEFORE UPDATE ON salon_invitations
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Função para marcar convites expirados automaticamente
CREATE OR REPLACE FUNCTION mark_expired_invitations()
RETURNS void AS $$
BEGIN
    UPDATE salon_invitations 
    SET status = 'expired' 
    WHERE status = 'pending' 
      AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 14. Verificar se as modificações foram aplicadas
SELECT 
    'VERIFICAÇÃO' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'salon_employees' 
  AND column_name = 'status';

-- 15. Mostrar estrutura da nova tabela de convites
SELECT 
    'NOVA TABELA' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'salon_invitations'
ORDER BY ordinal_position;

-- 16. Verificar se há funcionários com status 'pending'
SELECT 
    'FUNCIONÁRIOS PENDENTES' as tipo,
    COUNT(*) as total_pending
FROM salon_employees 
WHERE status = 'pending';



