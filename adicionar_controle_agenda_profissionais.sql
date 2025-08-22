-- Script para adicionar controle de agenda profissional
-- Este script adiciona campos para controlar se o profissional pode usar a agenda

-- Adicionar coluna para controlar se a agenda está habilitada
ALTER TABLE salon_professionals 
ADD COLUMN IF NOT EXISTS agenda_enabled BOOLEAN DEFAULT FALSE;

-- Adicionar coluna para data de habilitação da agenda
ALTER TABLE salon_professionals 
ADD COLUMN IF NOT EXISTS agenda_enabled_at TIMESTAMPTZ;

-- Adicionar coluna para quem habilitou a agenda
ALTER TABLE salon_professionals 
ADD COLUMN IF NOT EXISTS agenda_enabled_by UUID REFERENCES users(id);

-- Adicionar comentários para documentação
COMMENT ON COLUMN salon_professionals.agenda_enabled IS 'Indica se o profissional pode usar a agenda profissional';
COMMENT ON COLUMN salon_professionals.agenda_enabled_at IS 'Data e hora quando a agenda foi habilitada';
COMMENT ON COLUMN salon_professionals.agenda_enabled_by IS 'ID do usuário que habilitou a agenda';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_salon_professionals_agenda_enabled ON salon_professionals(agenda_enabled);

-- Atualizar políticas RLS para incluir controle de agenda
DROP POLICY IF EXISTS "Gerenciar profissionais do salão" ON salon_professionals;

-- Nova política que permite apenas dono do salão ou funcionários com permissão gerenciar agenda
CREATE POLICY "Gerenciar profissionais do salão" ON salon_professionals
    FOR ALL USING (
        auth.uid() = professional_id OR 
        auth.uid() IN (
            SELECT owner_id FROM salons_studios WHERE id = salon_id
        ) OR
        auth.uid() IN (
            SELECT se.user_id 
            FROM salon_employees se 
            WHERE se.salon_id = salon_professionals.salon_id 
            AND se.status = 'active'
            AND (se.permissions->>'employees')::jsonb ? 'edit'
        )
    );

-- Política específica para controle de agenda (apenas dono ou funcionários com permissão)
CREATE POLICY "Controle de agenda profissional" ON salon_professionals
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT owner_id FROM salons_studios WHERE id = salon_id
        ) OR
        auth.uid() IN (
            SELECT se.user_id 
            FROM salon_employees se 
            WHERE se.salon_id = salon_professionals.salon_id 
            AND se.status = 'active'
            AND (se.permissions->>'employees')::jsonb ? 'edit'
        )
    );

-- Verificar se as colunas foram adicionadas
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'salon_professionals' 
AND column_name IN ('agenda_enabled', 'agenda_enabled_at', 'agenda_enabled_by')
ORDER BY column_name;
