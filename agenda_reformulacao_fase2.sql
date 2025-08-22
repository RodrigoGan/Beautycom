-- =====================================================
-- REFORMULAÇÃO DA AGENDA - FASE 2: NOVA ESTRUTURA
-- =====================================================

-- 1. NOVA TABELA DE AGENDAMENTOS (ESTRUTURA COMPLETA)
CREATE TABLE appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID REFERENCES salons_studios(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
    payment_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    price DECIMAL(10,2) NOT NULL,
    confirmation_code TEXT UNIQUE,
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE DISPONIBILIDADE DE PROFISSIONAIS
CREATE TABLE professional_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID REFERENCES users(id) ON DELETE CASCADE,
    salon_id UUID REFERENCES salons_studios(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    break_start TIME,
    break_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(professional_id, salon_id, day_of_week)
);

-- 3. TABELA DE BLOQUEIOS DE AGENDA
CREATE TABLE schedule_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID REFERENCES users(id) ON DELETE CASCADE,
    salon_id UUID REFERENCES salons_studios(id) ON DELETE CASCADE,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    reason TEXT,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_appointments_salon_date ON appointments(salon_id, date);
CREATE INDEX idx_appointments_professional_date ON appointments(professional_id, date);
CREATE INDEX idx_appointments_client_date ON appointments(client_id, date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX idx_availability_professional_day ON professional_availability(professional_id, day_of_week);
CREATE INDEX idx_availability_salon_day ON professional_availability(salon_id, day_of_week);
CREATE INDEX idx_blocks_professional_datetime ON schedule_blocks(professional_id, start_datetime, end_datetime);
CREATE INDEX idx_blocks_salon_datetime ON schedule_blocks(salon_id, start_datetime, end_datetime);

-- 5. TRIGGERS PARA UPDATED_AT
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at 
    BEFORE UPDATE ON professional_availability 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at 
    BEFORE UPDATE ON schedule_blocks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. HABILITAR ROW LEVEL SECURITY
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS DE SEGURANÇA PARA APPOINTMENTS
CREATE POLICY "Users can view their own appointments" ON appointments
    FOR SELECT USING (
        auth.uid() = client_id OR 
        auth.uid() = professional_id OR
        auth.uid() IN (
            SELECT owner_id FROM salons_studios WHERE id = appointments.salon_id
        )
    );

CREATE POLICY "Users can create appointments" ON appointments
    FOR INSERT WITH CHECK (
        auth.uid() = client_id OR
        auth.uid() IN (
            SELECT owner_id FROM salons_studios WHERE id = appointments.salon_id
        )
    );

CREATE POLICY "Users can update appointments" ON appointments
    FOR UPDATE USING (
        auth.uid() = client_id OR 
        auth.uid() = professional_id OR
        auth.uid() IN (
            SELECT owner_id FROM salons_studios WHERE id = appointments.salon_id
        )
    );

-- 8. POLÍTICAS DE SEGURANÇA PARA AVAILABILITY
CREATE POLICY "Professionals can manage their availability" ON professional_availability
    FOR ALL USING (
        auth.uid() = professional_id OR
        auth.uid() IN (
            SELECT owner_id FROM salons_studios WHERE id = professional_availability.salon_id
        )
    );

-- 9. POLÍTICAS DE SEGURANÇA PARA SCHEDULE BLOCKS
CREATE POLICY "Professionals can manage their blocks" ON schedule_blocks
    FOR ALL USING (
        auth.uid() = professional_id OR
        auth.uid() IN (
            SELECT owner_id FROM salons_studios WHERE id = schedule_blocks.salon_id
        )
    );

-- 10. VERIFICAR CRIAÇÃO DAS TABELAS
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('appointments', 'professional_availability', 'schedule_blocks')
ORDER BY table_name;
