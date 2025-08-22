-- =====================================================
-- CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS BEAUTYCOM
-- =====================================================

-- 1. HABILITAR EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. CRIAR TABELAS
-- =====================================================

-- Tabela de usuários (estende a auth.users do Supabase)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'professional', 'client')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de serviços
CREATE TABLE public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- em minutos
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de profissionais
CREATE TABLE public.professionals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    specialties TEXT[] DEFAULT '{}',
    availability JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CRIAR FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at em todas as tabelas
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON public.services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at 
    BEFORE UPDATE ON public.professionals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON public.appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. CONFIGURAR SEGURANÇA (RLS)
-- =====================================================

-- Habilitar Row Level Security em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CRIAR POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Políticas para tabela users
CREATE POLICY "Users can view their own profile" 
    ON public.users FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.users FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
    ON public.users FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Políticas para tabela services
CREATE POLICY "Anyone can view services" 
    ON public.services FOR SELECT 
    USING (true);

CREATE POLICY "Only admins can manage services" 
    ON public.services FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Políticas para tabela professionals
CREATE POLICY "Anyone can view professionals" 
    ON public.professionals FOR SELECT 
    USING (true);

CREATE POLICY "Professionals can update their own profile" 
    ON public.professionals FOR UPDATE 
    USING (
        user_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'professional'
        )
    );

CREATE POLICY "Professionals can insert their own profile" 
    ON public.professionals FOR INSERT 
    WITH CHECK (
        user_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'professional'
        )
    );

-- Políticas para tabela appointments
CREATE POLICY "Users can view their own appointments" 
    ON public.appointments FOR SELECT 
    USING (
        client_id = auth.uid() OR 
        professional_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can create appointments" 
    ON public.appointments FOR INSERT 
    WITH CHECK (
        client_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'professional')
        )
    );

CREATE POLICY "Users can update appointments" 
    ON public.appointments FOR UPDATE 
    USING (
        client_id = auth.uid() OR 
        professional_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- =====================================================
-- 6. INSERIR DADOS INICIAIS
-- =====================================================

-- Inserir serviços de exemplo
INSERT INTO public.services (name, description, duration, price, category) VALUES
('Corte Feminino', 'Corte e finalização para cabelos femininos', 60, 80.00, 'Cabelo'),
('Corte Masculino', 'Corte tradicional para homens', 30, 40.00, 'Cabelo'),
('Coloração', 'Coloração completa com produtos profissionais', 120, 150.00, 'Cabelo'),
('Manicure', 'Cutilagem, esmaltação e finalização', 45, 35.00, 'Unhas'),
('Pedicure', 'Cutilagem, esmaltação e finalização', 45, 35.00, 'Unhas'),
('Maquiagem', 'Maquiagem para eventos especiais', 90, 120.00, 'Maquiagem'),
('Limpeza de Pele', 'Limpeza profunda e hidratação', 60, 80.00, 'Estética'),
('Hidratação', 'Tratamento hidratante para cabelos', 45, 60.00, 'Cabelo'),
('Escova', 'Escova progressiva ou definitiva', 90, 200.00, 'Cabelo'),
('Sobrancelha', 'Design e henna para sobrancelhas', 30, 25.00, 'Estética');

-- =====================================================
-- 7. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- =====================================================

-- Índices para appointments
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_professional_id ON public.appointments(professional_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- Índices para services
CREATE INDEX idx_services_category ON public.services(category);

-- Índices para professionals
CREATE INDEX idx_professionals_user_id ON public.professionals(user_id);

-- =====================================================
-- 8. VERIFICAR CONFIGURAÇÃO
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'services', 'professionals', 'appointments');

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Verificar serviços inseridos
SELECT * FROM public.services ORDER BY category, name;

-- =====================================================
-- CONFIGURAÇÃO CONCLUÍDA!
-- =====================================================

-- Agora você pode:
-- 1. Configurar as variáveis de ambiente no seu projeto
-- 2. Testar a integração
-- 3. Criar usuários através da interface do Supabase ou da aplicação 