-- =====================================================
-- CRIAR TABELA DE LOGS PARA DEBUG
-- =====================================================

-- Tabela para armazenar logs do frontend
CREATE TABLE IF NOT EXISTS debug_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    component_name TEXT NOT NULL,
    log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warn', 'error', 'debug')),
    message TEXT NOT NULL,
    data JSONB,
    user_id UUID REFERENCES users(id),
    salon_id UUID REFERENCES salons_studios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_debug_logs_component ON debug_logs(component_name);
CREATE INDEX IF NOT EXISTS idx_debug_logs_level ON debug_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_debug_logs_created_at ON debug_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_debug_logs_salon_id ON debug_logs(salon_id);

-- RLS para a tabela de logs
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seus próprios logs
CREATE POLICY "Users can view their own debug logs" ON debug_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários podem inserir logs
CREATE POLICY "Users can insert debug logs" ON debug_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Função para limpar logs antigos (manter apenas últimos 7 dias)
CREATE OR REPLACE FUNCTION cleanup_old_debug_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM debug_logs 
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Agendar limpeza automática (executar manualmente por enquanto)
-- SELECT cleanup_old_debug_logs();


