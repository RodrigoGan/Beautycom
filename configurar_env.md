# 🔧 Configurar Arquivo .env

## ❌ Problema Identificado

A chave anônima do Supabase está incompleta no arquivo `.env`. 

## ✅ Solução

Você precisa editar o arquivo `.env` e adicionar a chave anônima completa.

### 1. Abra o arquivo `.env` no VS Code
### 2. Substitua a linha da chave anônima pela chave completa:

```env
VITE_SUPABASE_URL=https://dgkzxadlmiafbegmdxcz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna3p4YWRsbW1hZmJegmdxcz.supabase.co
VITE_APP_NAME=Beautycom
VITE_APP_VERSION=1.0.0
```

### 3. A chave anônima completa deve ser algo como:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna3p4YWRsbW1hZmJegmdxcz.supabase.co
```

### 4. Para obter a chave completa:
- Vá no Supabase
- Settings > API
- Copie a "anon public" key completa

## 🧪 Depois de configurar, teste com:

```bash
node test-supabase.js
```

## 🚀 Se funcionar, execute:

```bash
npm run dev
``` 