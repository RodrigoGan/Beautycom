-- Script 3: Criar triggers para métricas do salão
-- Execute este script por último

-- Criar ou substituir função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover triggers existentes se houver (para evitar erro de duplicação)
DROP TRIGGER IF EXISTS update_salon_follows_updated_at ON salon_follows;
DROP TRIGGER IF EXISTS update_salon_interactions_updated_at ON salon_interactions;

-- Criar triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_salon_follows_updated_at 
    BEFORE UPDATE ON salon_follows
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salon_interactions_updated_at 
    BEFORE UPDATE ON salon_interactions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();



