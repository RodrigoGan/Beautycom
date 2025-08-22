-- Script para criar a tabela de funcionários do salão com sistema de permissões
-- Execute este script primeiro

-- Criar tabela de funcionários
CREATE TABLE IF NOT EXISTS salon_employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES salons_studios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'secretary', 'manager', 'receptionist', 'cleaner')),
    permissions JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, user_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_salon_employees_salon_id ON salon_employees(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_employees_user_id ON salon_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_salon_employees_role ON salon_employees(role);
CREATE INDEX IF NOT EXISTS idx_salon_employees_status ON salon_employees(status);
CREATE INDEX IF NOT EXISTS idx_salon_employees_created_at ON salon_employees(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE salon_employees ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
-- Visualizar funcionários do salão (apenas dono e funcionários ativos)
DROP POLICY IF EXISTS "Visualizar funcionários do salão" ON salon_employees;
CREATE POLICY "Visualizar funcionários do salão" ON salon_employees FOR SELECT USING (
    auth.uid() IN (
        SELECT owner_id FROM salons_studios WHERE id = salon_id
        UNION
        SELECT user_id FROM salon_employees WHERE salon_id = salon_employees.salon_id AND status = 'active'
    )
);

-- Gerenciar funcionários (apenas dono do salão)
DROP POLICY IF EXISTS "Gerenciar funcionários do salão" ON salon_employees;
CREATE POLICY "Gerenciar funcionários do salão" ON salon_employees FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM salons_studios WHERE id = salon_id)
);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_salon_employees_updated_at ON salon_employees;
CREATE TRIGGER update_salon_employees_updated_at 
    BEFORE UPDATE ON salon_employees 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE salon_employees IS 'Tabela para gerenciar funcionários administrativos do salão';
COMMENT ON COLUMN salon_employees.role IS 'Cargo do funcionário: admin, secretary, manager, receptionist, cleaner';
COMMENT ON COLUMN salon_employees.permissions IS 'Permissões granulares do funcionário em formato JSONB';
COMMENT ON COLUMN salon_employees.status IS 'Status do funcionário: active, inactive, suspended';

-- Inserir dados de exemplo (opcional - remover em produção)
-- INSERT INTO salon_employees (salon_id, user_id, role, permissions) VALUES 
-- ('ID_DO_SALAO', 'ID_DO_USUARIO', 'admin', '{"manage_employees": {"view": true, "add": true, "edit": true, "remove": true, "manage_permissions": true}}');



