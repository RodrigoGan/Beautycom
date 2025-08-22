# 🗂️ CONFIGURAÇÃO DO SUPABASE STORAGE - BEAUTYWALL

## 📁 BUCKETS NECESSÁRIOS

### 1. `post-media` - Mídia Geral
**Propósito**: Fotos únicas e vídeos
- ✅ **Fotos Únicas**: Posts com uma foto
- ✅ **Vídeos**: Posts com vídeo (máx. 1 min)
- ✅ **Estrutura**: `post-media/{post_id}/{filename}`

### 2. `post-gallery` - Carrosséis
**Propósito**: Múltiplas fotos para carrossel
- ✅ **Carrosséis**: Até 5 fotos por post
- ✅ **Estrutura**: `post-gallery/{post_id}/{order}_{filename}`

### 3. `post-before-after` - Antes e Depois
**Propósito**: Fotos específicas de transformação
- ✅ **Antes**: `post-before-after/{post_id}/before_{filename}`
- ✅ **Depois**: `post-before-after/{post_id}/after_{filename}`

## 🔧 CONFIGURAÇÃO DOS BUCKETS

### Passo 1: Criar Buckets no Supabase Dashboard
1. Acesse **Storage** no Supabase Dashboard
2. Clique em **"New bucket"**
3. Crie os 3 buckets com as seguintes configurações:

#### Bucket: `post-media`
- **Name**: `post-media`
- **Public**: ✅ Sim (para visualização)
- **File size limit**: 50MB
- **Allowed MIME types**: `image/*, video/*`

#### Bucket: `post-gallery`
- **Name**: `post-gallery`
- **Public**: ✅ Sim (para visualização)
- **File size limit**: 50MB
- **Allowed MIME types**: `image/*`

#### Bucket: `post-before-after`
- **Name**: `post-before-after`
- **Public**: ✅ Sim (para visualização)
- **File size limit**: 50MB
- **Allowed MIME types**: `image/*`

### Passo 2: Configurar RLS Policies

#### Para `post-media`:
```sql
-- Permitir upload para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');

-- Permitir visualização para todos
CREATE POLICY "Todos podem visualizar mídia" ON storage.objects
FOR SELECT USING (bucket_id = 'post-media');

-- Permitir atualização para o autor
CREATE POLICY "Autor pode atualizar mídia" ON storage.objects
FOR UPDATE USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir exclusão para o autor
CREATE POLICY "Autor pode deletar mídia" ON storage.objects
FOR DELETE USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Para `post-gallery`:
```sql
-- Permitir upload para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'post-gallery' AND auth.role() = 'authenticated');

-- Permitir visualização para todos
CREATE POLICY "Todos podem visualizar galeria" ON storage.objects
FOR SELECT USING (bucket_id = 'post-gallery');

-- Permitir atualização para o autor
CREATE POLICY "Autor pode atualizar galeria" ON storage.objects
FOR UPDATE USING (bucket_id = 'post-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir exclusão para o autor
CREATE POLICY "Autor pode deletar galeria" ON storage.objects
FOR DELETE USING (bucket_id = 'post-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Para `post-before-after`:
```sql
-- Permitir upload para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'post-before-after' AND auth.role() = 'authenticated');

-- Permitir visualização para todos
CREATE POLICY "Todos podem visualizar antes/depois" ON storage.objects
FOR SELECT USING (bucket_id = 'post-before-after');

-- Permitir atualização para o autor
CREATE POLICY "Autor pode atualizar antes/depois" ON storage.objects
FOR UPDATE USING (bucket_id = 'post-before-after' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir exclusão para o autor
CREATE POLICY "Autor pode deletar antes/depois" ON storage.objects
FOR DELETE USING (bucket_id = 'post-before-after' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 📋 ESTRUTURA DE ARQUIVOS

### Exemplo de Estrutura:
```
post-media/
├── 123e4567-e89b-12d3-a456-426614174000/
│   ├── video_principal.mp4
│   └── foto_unica.jpg

post-gallery/
├── 123e4567-e89b-12d3-a456-426614174000/
│   ├── 1_foto1.jpg
│   ├── 2_foto2.jpg
│   ├── 3_foto3.jpg
│   ├── 4_foto4.jpg
│   └── 5_foto5.jpg

post-before-after/
├── 123e4567-e89b-12d3-a456-426614174000/
│   ├── before_transformacao.jpg
│   └── after_transformacao.jpg
```

## 🔗 URLs de Exemplo

### Para Mídia Única:
```
https://[project].supabase.co/storage/v1/object/public/post-media/123e4567-e89b-12d3-a456-426614174000/foto_unica.jpg
```

### Para Carrossel:
```
https://[project].supabase.co/storage/v1/object/public/post-gallery/123e4567-e89b-12d3-a456-426614174000/1_foto1.jpg
```

### Para Antes e Depois:
```
https://[project].supabase.co/storage/v1/object/public/post-before-after/123e4567-e89b-12d3-a456-426614174000/before_transformacao.jpg
https://[project].supabase.co/storage/v1/object/public/post-before-after/123e4567-e89b-12d3-a456-426614174000/after_transformacao.jpg
```

## ⚠️ IMPORTANTE

1. **Execute primeiro** o arquivo `criar_tabelas_beautywall.sql`
2. **Depois configure** os buckets no Supabase Dashboard
3. **Por último** execute as políticas RLS do Storage
4. **Teste** com um upload simples antes de integrar no código

## 🎯 PRÓXIMOS PASSOS

1. ✅ Criar tabelas no banco
2. ⏳ Configurar buckets no Supabase
3. ⏳ Implementar upload no modal
4. ⏳ Integrar com BeautyWall
5. ⏳ Adicionar interações (like/comentário) 