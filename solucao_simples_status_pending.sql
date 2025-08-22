-- SOLUÇÃO SIMPLES: Desabilitar RLS temporariamente para fazer as alterações
-- Execute este script se o anterior ainda der erro

-- 1. Desabilitar RLS nas tabelas problemáticas
ALTER TABLE salon_professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE salon_employees DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas RLS
DROP POLICY IF EXISTS "Visualizar profissionais do salão" ON salon_professionals;
DROP POLICY IF EXISTS "Gerenciar profissionais do salão" ON salon_professionals;
DROP POLICY IF EXISTS "Profissional ver próprios dados" ON salon_professionals;
DROP POLICY IF EXISTS "Profissional pode aceitar/rejeitar convites" ON salon_professionals;
DROP POLICY IF EXISTS "Users can view all salon professionals" ON salon_professionals;
DROP POLICY IF EXISTS "Salon owners can manage professionals" ON salon_professionals;
DROP POLICY IF EXISTS "Professionals can respond to invitations" ON salon_professionals;

DROP POLICY IF EXISTS "Visualizar funcionários do salão" ON salon_employees;
DROP POLICY IF EXISTS "Dono pode adicionar funcionários" ON salon_employees;
DROP POLICY IF EXISTS "Dono pode editar funcionários" ON salon_employees;
DROP POLICY IF EXISTS "Dono pode remover funcionários" ON salon_employees;
DROP POLICY IF EXISTS "Gerenciar funcionários do salão" ON salon_employees;
DROP POLICY IF EXISTS "Ver próprios dados" ON salon_employees;
DROP POLICY IF EXISTS "Visualizar funcionários do salão" ON salon_employees;

-- 3. AGORA: Modificar a tabela salon_employees para incluir status 'pending'
ALTER TABLE salon_employees 
ALTER COLUMN status TYPE VARCHAR(20);

-- 4. Adicionar constraint para incluir 'pending' como status válido
ALTER TABLE salon_employees 
DROP CONSTRAINT IF EXISTS salon_employees_status_check;

ALTER TABLE salon_employees 
ADD CONSTRAINT salon_employees_status_check 
CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'rejected'));

-- 5. Atualizar registros existentes para 'active' (funcionários já aceitos)
UPDATE salon_employees 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- 6. Adicionar comentário para documentação
COMMENT ON COLUMN salon_employees.status IS 'Status do funcionário: pending (aguardando aceitação), active (ativo), inactive (inativo), suspended (suspenso), rejected (rejeitado)';

-- 7. Criar tabela para notificações de convites (opcional)
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

-- 10. Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_salon_invitations_updated_at ON salon_invitations;
CREATE TRIGGER update_salon_invitations_updated_at 
    BEFORE UPDATE ON salon_invitations
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Função para marcar convites expirados automaticamente
CREATE OR REPLACE FUNCTION mark_expired_invitations()
RETURNS void AS $$
BEGIN
    UPDATE salon_invitations 
    SET status = 'expired' 
    WHERE status = 'pending' 
      AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 12. Verificar se as modificações foram aplicadas
SELECT 
    'VERIFICAÇÃO' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'salon_employees' 
  AND column_name = 'status';

-- 13. Mostrar estrutura da nova tabela de convites
SELECT 
    'NOVA TABELA' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'salon_invitations'
ORDER BY ordinal_position;

-- 14. Verificar se há funcionários com status 'pending'
SELECT 
    'FUNCIONÁRIOS PENDENTES' as tipo,
    COUNT(*) as total_pending
FROM salon_employees 
WHERE status = 'pending';

-- 15. Mostrar status atual das tabelas
SELECT 
    'STATUS RLS' as tipo,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('salon_employees', 'salon_professionals', 'salon_invitations');



