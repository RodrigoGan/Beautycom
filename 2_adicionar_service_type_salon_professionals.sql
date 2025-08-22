-- Script para adicionar campo service_type na tabela salon_professionals
-- Execute este script após criar a tabela salon_employees

-- Adicionar campo service_type para especificar o tipo de serviço do profissional
ALTER TABLE salon_professionals 
ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) CHECK (
    service_type IN ('barber', 'hairdresser', 'manicurist', 'esthetician', 'massage_therapist', 'makeup_artist', 'tattoo_artist', 'piercing_artist', 'other')
);

-- Adicionar comentário para documentação
COMMENT ON COLUMN salon_professionals.service_type IS 'Tipo de serviço oferecido pelo profissional: barber, hairdresser, manicurist, esthetician, massage_therapist, makeup_artist, tattoo_artist, piercing_artist, other';

-- Criar índice para performance em consultas por tipo de serviço
CREATE INDEX IF NOT EXISTS idx_salon_professionals_service_type ON salon_professionals(service_type);

-- Atualizar registros existentes com um valor padrão (opcional)
-- UPDATE salon_professionals SET service_type = 'other' WHERE service_type IS NULL;



