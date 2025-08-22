# 🚀 Guia Visual - Configuração Supabase

## 📋 Passo a Passo Completo

### 1. Criar Projeto no Supabase

1. **Acesse [supabase.com](https://supabase.com)**
2. **Faça login** ou crie uma conta
3. **Clique em "New Project"**
4. **Preencha os dados:**
   ```
   Name: Beautycom
   Database Password: [escolha uma senha forte]
   Region: [escolha a região mais próxima]
   ```

### 2. Obter Credenciais

Após criar o projeto:

1. **No menu lateral, clique em "Settings"** (ícone de engrenagem)
2. **Clique em "API"**
3. **Copie as seguintes informações:**
   - **Project URL** (algo como: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (chave longa que começa com `eyJ...`)

### 3. Configurar Variáveis de Ambiente

1. **Abra o arquivo `.env`** na raiz do seu projeto
2. **Substitua as credenciais:**

```env
VITE_SUPABASE_URL=https://sua-url-do-supabase.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
VITE_APP_NAME=Beautycom
VITE_APP_VERSION=1.0.0
```

### 4. Executar SQL no Supabase

1. **No painel do Supabase, clique em "SQL Editor"** (no menu lateral)
2. **Clique em "New Query"**
3. **Copie todo o conteúdo do arquivo `supabase_setup.sql`**
4. **Cole no editor SQL**
5. **Clique em "Run"** (botão azul)

### 5. Configurar Autenticação

1. **No menu lateral, clique em "Authentication"**
2. **Clique em "Settings"**
3. **Configure as URLs de redirecionamento:**
   - Adicione: `http://localhost:5173`
   - Adicione: `http://localhost:5173/login`
   - Adicione: `http://localhost:5173/cadastro`

### 6. Verificar Configuração

Após executar o SQL, você pode verificar se tudo foi criado:

1. **Vá em "Table Editor"** no menu lateral
2. **Você deve ver as tabelas:**
   - `users`
   - `services`
   - `professionals`
   - `appointments`

### 7. Testar a Integração

1. **Execute o projeto:**
   ```bash
   npm run dev
   ```

2. **Acesse:** `http://localhost:5173`

3. **Teste o cadastro e login**

## 🔧 Troubleshooting

### Erro: "Variáveis de ambiente não configuradas"
- Verifique se o arquivo `.env` está na raiz do projeto
- Verifique se as credenciais estão corretas
- Reinicie o servidor após alterar o `.env`

### Erro: "CORS policy"
- Vá em **Authentication > Settings** no Supabase
- Adicione `http://localhost:5173` nas URLs de redirecionamento

### Erro: "RLS policy"
- Verifique se o SQL foi executado completamente
- Confirme se as políticas foram criadas em **Authentication > Policies**

### Erro: "Table not found"
- Execute novamente o SQL completo
- Verifique se não há erros no console do SQL Editor

## 📊 Verificar Dados

Após executar o SQL, você pode verificar se os dados foram inseridos:

1. **Vá em "Table Editor"**
2. **Clique na tabela "services"**
3. **Você deve ver 10 serviços pré-cadastrados**

## 🎯 Próximos Passos

1. **Teste o cadastro** de um usuário
2. **Teste o login**
3. **Verifique se os dados aparecem** no Supabase
4. **Implemente as outras páginas** usando os hooks criados

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** no console do navegador
2. **Verifique os logs** no SQL Editor do Supabase
3. **Confirme se todas as etapas** foram seguidas
4. **Teste as consultas** diretamente no SQL Editor

---

**🎉 Parabéns! Seu Supabase está configurado e pronto para uso!** 