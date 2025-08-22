-- Script para adicionar status 'pending' na tabela salon_employees
-- Este script implementa o fluxo de aceitação para funcionários

-- 1. Modificar a tabela salon_employees para incluir status 'pending'
ALTER TABLE salon_employees 
ALTER COLUMN status TYPE VARCHAR(20);

-- 2. Adicionar constraint para incluir 'pending' como status válido
ALTER TABLE salon_employees 
DROP CONSTRAINT IF EXISTS salon_employees_status_check;

ALTER TABLE salon_employees 
ADD CONSTRAINT salon_employees_status_check 
CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'rejected'));

-- 3. Atualizar registros existentes para 'active' (funcionários já aceitos)
UPDATE salon_employees 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- 4. Adicionar comentário para documentação
COMMENT ON COLUMN salon_employees.status IS 'Status do funcionário: pending (aguardando aceitação), active (ativo), inactive (inativo), suspended (suspenso), rejected (rejeitado)';

-- 5. Criar tabela para notificações de convites (opcional, para melhor UX)
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

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_salon_invitations_salon_id ON salon_invitations(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_invitations_user_id ON salon_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_salon_invitations_status ON salon_invitations(status);
CREATE INDEX IF NOT EXISTS idx_salon_invitations_type ON salon_invitations(invitation_type);

-- 7. Comentários para documentação
COMMENT ON TABLE salon_invitations IS 'Tabela para gerenciar convites de funcionários e profissionais';
COMMENT ON COLUMN salon_invitations.invitation_type IS 'Tipo de convite: employee (funcionário) ou professional (profissional)';
COMMENT ON COLUMN salon_invitations.role IS 'Cargo do funcionário (apenas para convites de funcionário)';
COMMENT ON COLUMN salon_invitations.service_type IS 'Tipo de serviço do profissional (apenas para convites de profissional)';
COMMENT ON COLUMN salon_invitations.message IS 'Mensagem personalizada do convite';
COMMENT ON COLUMN salon_invitations.status IS 'Status do convite: pending, accepted, rejected, expired';
COMMENT ON COLUMN salon_invitations.expires_at IS 'Data de expiração do convite (30 dias por padrão)';

-- 8. Habilitar RLS na tabela de convites
ALTER TABLE salon_invitations ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS para convites
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

-- 12. Criar job para executar a função periodicamente (opcional)
-- Nota: No Supabase, você pode configurar isso via cron jobs
-- SELECT cron.schedule('mark-expired-invitations', '0 0 * * *', 'SELECT mark_expired_invitations();');

-- 13. Verificar se as modificações foram aplicadas
SELECT 
    'VERIFICAÇÃO' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'salon_employees' 
  AND column_name = 'status';

-- 14. Mostrar estrutura da nova tabela de convites
SELECT 
    'NOVA TABELA' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'salon_invitations'
ORDER BY ordinal_position;



