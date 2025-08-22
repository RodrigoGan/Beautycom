-- =====================================================
-- REFORMULAÇÃO DA AGENDA - FASE 1: LIMPEZA
-- =====================================================

-- 1. BACKUP DE SEGURANÇA
-- Execute este comando primeiro para fazer backup da tabela appointments
CREATE TABLE IF NOT EXISTS appointments_backup AS SELECT * FROM appointments;

-- 2. VERIFICAR SE O BACKUP FOI CRIADO
-- Execute para confirmar que o backup foi criado com sucesso
SELECT COUNT(*) as total_appointments_backup FROM appointments_backup;

-- 3. EXCLUIR TABELA ANTIGA DE AGENDAMENTOS
-- Execute após confirmar que o backup foi criado
DROP TABLE IF EXISTS appointments CASCADE;

-- 4. REMOVER TRIGGERS ANTIGOS
-- Execute para limpar triggers relacionados
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;

-- 5. REMOVER POLÍTICAS RLS ANTIGAS
-- Execute para limpar políticas de segurança
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update appointments" ON appointments;

-- 6. VERIFICAR LIMPEZA
-- Execute para confirmar que a tabela foi removida
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%appointment%';
