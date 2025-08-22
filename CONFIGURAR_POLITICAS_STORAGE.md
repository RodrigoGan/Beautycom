# 🔧 Configurar Políticas do Storage - Dashboard

## ✅ **Status Atual**
- ✅ SQL executado com sucesso
- ✅ Buckets criados: `fotoperfil`, `fotopost`, `fotodecapa`, `logotipo`
- ✅ Todos marcados como "Public"

## 🎯 **Próximo Passo: Configurar Políticas**

### **📋 Como Fazer via Dashboard:**

#### **1. Acessar Storage:**
1. **Vá para** Supabase Dashboard
2. **Clique em** "Storage" no menu lateral
3. **Você verá** os 4 buckets criados

#### **2. Configurar Políticas para Cada Bucket:**

**Para cada bucket (`fotoperfil`, `fotopost`, `fotodecapa`, `logotipo`):**

1. **Clique no bucket** (ex: `fotoperfil`)
2. **Vá para** aba "Policies"
3. **Clique em** "New Policy"
4. **Configure as 4 políticas:**

---

## 📋 **Políticas Necessárias**

### **🔄 Política 1: Upload Autenticado**
- **Policy Name:** `Allow authenticated uploads`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`
- **Policy definition:** `true`

### **👁️ Política 2: Visualização Pública**
- **Policy Name:** `Allow public viewing`
- **Allowed operation:** `SELECT`
- **Target roles:** `public`
- **Policy definition:** `true`

### **✏️ Política 3: Atualização Autenticada**
- **Policy Name:** `Allow authenticated updates`
- **Allowed operation:** `UPDATE`
- **Target roles:** `authenticated`
- **Policy definition:** `true`

### **🗑️ Política 4: Exclusão Autenticada**
- **Policy Name:** `Allow authenticated deletes`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated`
- **Policy definition:** `true`

---

## 🎯 **Passo a Passo Detalhado**

### **📋 Para o Bucket `fotoperfil`:**

1. **Clique em** `fotoperfil`
2. **Vá para** aba "Policies"
3. **Clique em** "New Policy"
4. **Configure cada política:**

#### **Política 1:**
- **Name:** `Allow authenticated uploads`
- **Operation:** `INSERT`
- **Roles:** `authenticated`
- **Definition:** `true`
- **Clique em** "Review" e depois "Save policy"

#### **Política 2:**
- **Name:** `Allow public viewing`
- **Operation:** `SELECT`
- **Roles:** `public`
- **Definition:** `true`
- **Clique em** "Review" e depois "Save policy"

#### **Política 3:**
- **Name:** `Allow authenticated updates`
- **Operation:** `UPDATE`
- **Roles:** `authenticated`
- **Definition:** `true`
- **Clique em** "Review" e depois "Save policy"

#### **Política 4:**
- **Name:** `Allow authenticated deletes`
- **Operation:** `DELETE`
- **Roles:** `authenticated`
- **Definition:** `true`
- **Clique em** "Review" e depois "Save policy"

### **📋 Repita para os outros buckets:**
- `fotopost`
- `fotodecapa`
- `logotipo`

---

## ✅ **Verificação**

### **📋 Após configurar todos os buckets:**

1. **Clique em cada bucket**
2. **Vá para** aba "Policies"
3. **Verifique** que cada um tem 4 políticas ativas
4. **Confirme** que as políticas estão habilitadas

### **📋 Resultado esperado:**
- ✅ **4 buckets** criados
- ✅ **4 políticas** por bucket
- ✅ **Políticas ativas** e funcionando

---

## 🎯 **Teste Final**

### **📋 Após configurar todas as políticas:**

1. **Acesse** `/cadastro`
2. **Preencha** todos os campos obrigatórios
3. **Faça upload** de uma foto
4. **Clique em** "Próximo"

### **✅ Resultado esperado:**
- ✅ **Sem erros RLS** no console
- ✅ **Upload de foto** funcionando
- ✅ **Dados salvos** no banco
- ✅ **Toast de sucesso** aparece

---

## 🔍 **Troubleshooting**

### **❌ Se der erro de Storage:**

#### **Verificar via SQL:**
```sql
-- Execute no SQL Editor
SELECT name, public FROM storage.buckets;

SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';
```

#### **Verificar via Dashboard:**
1. **Storage** → Clique em cada bucket
2. **Policies** → Verificar se há 4 políticas
3. **Settings** → Verificar se está "Public"

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

**🎯 Configure as políticas e teste o cadastro! Deve funcionar perfeitamente! 📁** 