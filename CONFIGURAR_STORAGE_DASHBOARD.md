# 📁 Configurar Storage via Dashboard - Supabase

## 🔧 **Problema de Permissões Identificado**

### **❌ Erro Encontrado:**
```
ERROR: 42501: must be owner of table objects
```

### **🔍 Causa:**
Você não tem permissões para modificar as tabelas do Storage via SQL, mas pode configurar via Dashboard.

---

## ✅ **Solução em Duas Partes**

### **📋 Parte 1: SQL Script (Execute Primeiro)**
```sql
-- Arquivo: solucao_alternativa_rls.sql
-- Execute este script no SQL Editor
```

### **📋 Parte 2: Configurar Storage via Dashboard**

---

## 🎯 **Configurar Storage via Dashboard**

### **📋 Passo 1: Acessar Storage**

1. **Vá para** o Supabase Dashboard
2. **Clique em** "Storage" no menu lateral
3. **Verifique** se já existem buckets

### **📋 Passo 2: Criar Buckets (se não existirem)**

#### **Bucket `fotoperfil`:**
1. **Clique em** "New Bucket"
2. **Nome:** `fotoperfil`
3. **Marque** "Public bucket"
4. **Clique em** "Create bucket"

#### **Bucket `fotopost`:**
1. **Clique em** "New Bucket"
2. **Nome:** `fotopost`
3. **Marque** "Public bucket"
4. **Clique em** "Create bucket"

#### **Bucket `fotodecapa`:**
1. **Clique em** "New Bucket"
2. **Nome:** `fotodecapa`
3. **Marque** "Public bucket"
4. **Clique em** "Create bucket"

#### **Bucket `logotipo`:**
1. **Clique em** "New Bucket"
2. **Nome:** `logotipo`
3. **Marque** "Public bucket"
4. **Clique em** "Create bucket"

### **📋 Passo 3: Configurar Políticas**

#### **Para cada bucket criado:**

1. **Clique no bucket** (ex: `fotoperfil`)
2. **Vá para** aba "Policies"
3. **Clique em** "New Policy"
4. **Configure as políticas:**

#### **Política 1: Upload Autenticado**
- **Policy Name:** `Allow authenticated uploads`
- **Allowed operation:** INSERT
- **Target roles:** authenticated
- **Policy definition:** `true`

#### **Política 2: Visualização Pública**
- **Policy Name:** `Allow public viewing`
- **Allowed operation:** SELECT
- **Target roles:** public
- **Policy definition:** `true`

#### **Política 3: Atualização Autenticada**
- **Policy Name:** `Allow authenticated updates`
- **Allowed operation:** UPDATE
- **Target roles:** authenticated
- **Policy definition:** `true`

#### **Política 4: Exclusão Autenticada**
- **Policy Name:** `Allow authenticated deletes`
- **Allowed operation:** DELETE
- **Target roles:** authenticated
- **Policy definition:** `true`

---

## ✅ **Verificação da Configuração**

### **📋 Verificar Buckets:**
1. **Storage** → Deve mostrar 4 buckets
2. **Cada bucket** deve estar marcado como "Public"

### **📋 Verificar Políticas:**
1. **Clique em cada bucket**
2. **Aba "Policies"** → Deve ter 4 políticas
3. **Políticas devem estar ativas**

---

## 🎯 **Teste Completo**

### **📋 Após Configurar:**

1. **Execute** o script SQL (`solucao_alternativa_rls.sql`)
2. **Configure** Storage via Dashboard
3. **Teste** o cadastro:
   - Acesse `/cadastro`
   - Preencha todos os campos
   - Faça upload de foto
   - Clique em "Próximo"

### **✅ Resultado Esperado:**
- ✅ **Sem erros RLS** no console
- ✅ **Upload de foto** funcionando
- ✅ **Dados salvos** no banco
- ✅ **Toast de sucesso** aparece

---

## 🔍 **Troubleshooting**

### **❌ Se ainda der erro de Storage:**

#### **Verificar Buckets:**
```sql
-- Execute no SQL Editor
SELECT name, public FROM storage.buckets;
```

#### **Verificar Políticas:**
```sql
-- Execute no SQL Editor
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';
```

### **❌ Se der erro de Users:**

#### **Verificar RLS:**
```sql
-- Execute no SQL Editor
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';
```

#### **Resultado esperado:**
```
schemaname | tablename | rowsecurity
-----------+-----------+------------
public     | users     | f
```

---

## 📊 **Monitoramento**

### **✅ Logs para Verificar:**
```javascript
// No console do navegador
console.log('Cadastro iniciado com sucesso!')
console.log('Foto uploadada:', photoUrl)
```

### **✅ No Supabase Dashboard:**
- **Table Editor** → `users` → Novos registros
- **Storage** → `fotoperfil` → Arquivos uploadados

---

## 🔄 **Próximos Passos**

### **📋 Após Confirmar Funcionamento:**

1. **Teste** todas as funcionalidades
2. **Documente** a configuração
3. **Reabilite RLS** com políticas corretas
4. **Implemente** segurança adequada

---

**🎯 Configuração completa! Cadastro deve funcionar agora! 📁**

**⚠️ Lembre-se: Configure Storage via Dashboard, não via SQL.** 