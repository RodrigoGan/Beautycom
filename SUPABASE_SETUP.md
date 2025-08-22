# Configuração do Supabase para Beautycom

## 1. Configuração Inicial

### 1.1 Criar projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha sua organização
5. Preencha os dados do projeto:
   - **Name**: Beautycom
   - **Database Password**: (escolha uma senha forte)
   - **Region**: (escolha a região mais próxima)

### 1.2 Obter credenciais
Após criar o projeto, vá em **Settings > API** e copie:
- **Project URL** (VITE_SUPABASE_URL)
- **anon public** key (VITE_SUPABASE_ANON_KEY)

## 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
VITE_SUPABASE_URL=sua_url_do_supabase_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase_aqui
VITE_APP_NAME=Beautycom
VITE_APP_VERSION=1.0.0
```

## 3. Configurar Banco de Dados

### 3.1 Executar SQL no Supabase

Vá em **SQL Editor** no Supabase e execute o seguinte SQL:

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para services (todos podem ver)
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Only admins can manage services" ON public.services FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Políticas para professionals
CREATE POLICY "Anyone can view professionals" ON public.professionals FOR SELECT USING (true);
CREATE POLICY "Professionals can update their own profile" ON public.professionals FOR UPDATE USING (
    user_id = auth.uid() AND 
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'professional'
    )
);

-- Políticas para appointments
CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT USING (
    client_id = auth.uid() OR 
    professional_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

CREATE POLICY "Users can create appointments" ON public.appointments FOR INSERT WITH CHECK (
    client_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role IN ('admin', 'professional')
    )
);

CREATE POLICY "Users can update appointments" ON public.appointments FOR UPDATE USING (
    client_id = auth.uid() OR 
    professional_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);
```

### 3.2 Inserir dados iniciais

```sql
-- Inserir serviços de exemplo
INSERT INTO public.services (name, description, duration, price, category) VALUES
('Corte Feminino', 'Corte e finalização para cabelos femininos', 60, 80.00, 'Cabelo'),
('Corte Masculino', 'Corte tradicional para homens', 30, 40.00, 'Cabelo'),
('Coloração', 'Coloração completa com produtos profissionais', 120, 150.00, 'Cabelo'),
('Manicure', 'Cutilagem, esmaltação e finalização', 45, 35.00, 'Unhas'),
('Pedicure', 'Cutilagem, esmaltação e finalização', 45, 35.00, 'Unhas'),
('Maquiagem', 'Maquiagem para eventos especiais', 90, 120.00, 'Maquiagem'),
('Limpeza de Pele', 'Limpeza profunda e hidratação', 60, 80.00, 'Estética');

-- Criar usuário admin (substitua pelo email desejado)
-- Primeiro crie o usuário no auth.users através do painel do Supabase
-- Depois execute:
-- INSERT INTO public.users (id, email, name, role) VALUES 
-- ('uuid-do-usuario-admin', 'admin@beautycom.com', 'Administrador', 'admin');
```

## 4. Configurar Autenticação

### 4.1 Configurar Email
1. Vá em **Authentication > Settings**
2. Configure o provedor de email (SMTP ou use o Supabase)
3. Personalize os templates de email

### 4.2 Configurar Redirecionamentos
1. Vá em **Authentication > URL Configuration**
2. Adicione as URLs de redirecionamento:
   - `http://localhost:5173` (desenvolvimento)
   - `https://seu-dominio.com` (produção)

## 5. Testar a Integração

1. Execute o projeto: `npm run dev`
2. Acesse `http://localhost:5173`
3. Teste o cadastro e login
4. Verifique se os dados estão sendo salvos no Supabase

## 6. Estrutura de Arquivos Criada

- `src/lib/supabase.ts` - Cliente Supabase e tipos
- `src/hooks/useSupabase.ts` - Hooks para autenticação e operações
- `src/contexts/AuthContext.tsx` - Contexto de autenticação
- `src/components/ProtectedRoute.tsx` - Proteção de rotas
- `env.example` - Exemplo de variáveis de ambiente

## 7. Próximos Passos

1. Implementar as páginas de login e cadastro usando os hooks criados
2. Adicionar funcionalidades específicas para cada tipo de usuário
3. Implementar o sistema de agendamentos
4. Adicionar notificações e relatórios
5. Configurar backup e monitoramento

## 8. Troubleshooting

### Erro de CORS
- Verifique se as URLs estão configuradas corretamente no Supabase
- Adicione `http://localhost:5173` nas configurações de autenticação

### Erro de RLS (Row Level Security)
- Verifique se as políticas estão configuradas corretamente
- Teste as consultas diretamente no SQL Editor

### Erro de variáveis de ambiente
- Verifique se o arquivo `.env` está na raiz do projeto
- Reinicie o servidor de desenvolvimento após alterar as variáveis 