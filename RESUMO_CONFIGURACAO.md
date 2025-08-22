# ✅ Checklist de Configuração Supabase - Beautycom

## 🎯 O que você precisa fazer agora:

### 1. Criar Projeto no Supabase
- [ ] Acesse [supabase.com](https://supabase.com)
- [ ] Faça login/crie conta
- [ ] Clique em "New Project"
- [ ] Nome: `Beautycom`
- [ ] Escolha região próxima
- [ ] Anote a senha do banco!

### 2. Obter Credenciais
- [ ] Vá em **Settings > API**
- [ ] Copie **Project URL**
- [ ] Copie **anon public key**

### 3. Configurar Variáveis de Ambiente
- [ ] Abra o arquivo `.env` (já criado)
- [ ] Substitua as credenciais pelas suas do Supabase

### 4. Executar SQL no Supabase
- [ ] Vá em **SQL Editor** no Supabase
- [ ] Clique em **"New Query"**
- [ ] Copie todo o conteúdo do arquivo `supabase_setup.sql`
- [ ] Cole no editor
- [ ] Clique em **"Run"**

### 5. Configurar Autenticação
- [ ] Vá em **Authentication > Settings**
- [ ] Adicione URLs de redirecionamento:
  - `http://localhost:5173`
  - `http://localhost:5173/login`
  - `http://localhost:5173/cadastro`

### 6. Testar Configuração
- [ ] Execute: `npm run dev`
- [ ] Acesse: `http://localhost:5173`
- [ ] Teste cadastro e login

## 📁 Arquivos Criados para Você:

1. **`supabase_setup.sql`** - SQL completo para executar
2. **`GUIA_SUPABASE.md`** - Guia visual passo a passo
3. **`test-supabase.js`** - Script de teste (opcional)
4. **`.env`** - Arquivo de variáveis (copiado do exemplo)

## 🔧 Troubleshooting Rápido:

### Erro: "Variáveis não configuradas"
```bash
# Verifique se o .env existe e tem as credenciais corretas
cat .env
```

### Erro: "CORS policy"
- Vá em **Authentication > Settings** no Supabase
- Adicione `http://localhost:5173` nas URLs

### Erro: "Table not found"
- Execute novamente o SQL completo
- Verifique se não há erros no console

## 🚀 Após Configurar:

1. **Teste o cadastro** de um usuário
2. **Teste o login**
3. **Verifique os dados** no Supabase
4. **Implemente outras páginas** usando os hooks

## 📞 Precisa de Ajuda?

Se encontrar problemas:

1. **Verifique os logs** no console do navegador
2. **Verifique os logs** no SQL Editor do Supabase
3. **Confirme se todas as etapas** foram seguidas
4. **Teste as consultas** diretamente no SQL Editor

---

**🎉 Depois de seguir este checklist, sua integração estará 100% funcional!**

### Próximos Passos:
1. ✅ Configurar Supabase
2. 🔄 Testar integração
3. 🚀 Implementar funcionalidades
4. 📱 Deploy da aplicação

**Boa sorte! Se precisar de ajuda, me avise! 🚀** 