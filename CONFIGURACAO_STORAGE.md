# 🗂️ Configuração do Supabase Storage

## 📋 **Resumo dos Buckets Criados**

Você criou 4 buckets no Supabase Storage:
- **`fotoperfil`** - Fotos de perfil dos usuários
- **`fotopost`** - Imagens dos posts do BeautyWall
- **`fotodecapa`** - Fotos de capa dos salões de beleza
- **`logotipo`** - Logotipos dos estabelecimentos

## 🔧 **Configuração dos Buckets**

### **1. Políticas de Segurança (RLS)**

Para cada bucket, configure as seguintes políticas:

#### **Bucket: `fotoperfil`**
```sql
-- Permitir upload para usuários autenticados
CREATE POLICY "Usuários podem fazer upload de foto de perfil" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'fotoperfil' AND auth.role() = 'authenticated');

-- Permitir visualização pública
CREATE POLICY "Fotos de perfil são públicas" ON storage.objects
FOR SELECT USING (bucket_id = 'fotoperfil');

-- Permitir atualização pelo proprietário
CREATE POLICY "Usuários podem atualizar sua foto" ON storage.objects
FOR UPDATE USING (bucket_id = 'fotoperfil' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir exclusão pelo proprietário
CREATE POLICY "Usuários podem deletar sua foto" ON storage.objects
FOR DELETE USING (bucket_id = 'fotoperfil' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### **Bucket: `fotopost`**
```sql
-- Permitir upload para usuários autenticados
CREATE POLICY "Usuários podem fazer upload de fotos de post" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'fotopost' AND auth.role() = 'authenticated');

-- Permitir visualização pública
CREATE POLICY "Fotos de posts são públicas" ON storage.objects
FOR SELECT USING (bucket_id = 'fotopost');

-- Permitir atualização pelo autor do post
CREATE POLICY "Autores podem atualizar fotos de posts" ON storage.objects
FOR UPDATE USING (bucket_id = 'fotopost' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir exclusão pelo autor do post
CREATE POLICY "Autores podem deletar fotos de posts" ON storage.objects
FOR DELETE USING (bucket_id = 'fotopost' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### **Bucket: `fotodecapa`**
```sql
-- Permitir upload para profissionais autenticados
CREATE POLICY "Profissionais podem fazer upload de foto de capa" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'fotodecapa' AND auth.role() = 'authenticated');

-- Permitir visualização pública
CREATE POLICY "Fotos de capa são públicas" ON storage.objects
FOR SELECT USING (bucket_id = 'fotodecapa');

-- Permitir atualização pelo proprietário do salão
CREATE POLICY "Proprietários podem atualizar foto de capa" ON storage.objects
FOR UPDATE USING (bucket_id = 'fotodecapa' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir exclusão pelo proprietário do salão
CREATE POLICY "Proprietários podem deletar foto de capa" ON storage.objects
FOR DELETE USING (bucket_id = 'fotodecapa' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### **Bucket: `logotipo`**
```sql
-- Permitir upload para profissionais autenticados
CREATE POLICY "Profissionais podem fazer upload de logotipo" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'logotipo' AND auth.role() = 'authenticated');

-- Permitir visualização pública
CREATE POLICY "Logotipos são públicos" ON storage.objects
FOR SELECT USING (bucket_id = 'logotipo');

-- Permitir atualização pelo proprietário
CREATE POLICY "Proprietários podem atualizar logotipo" ON storage.objects
FOR UPDATE USING (bucket_id = 'logotipo' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir exclusão pelo proprietário
CREATE POLICY "Proprietários podem deletar logotipo" ON storage.objects
FOR DELETE USING (bucket_id = 'logotipo' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### **2. Configurações dos Buckets**

#### **Configurações Recomendadas:**

| Bucket | Tamanho Máximo | Formatos | Compressão |
|--------|----------------|----------|------------|
| `fotoperfil` | 2MB | JPG, PNG, WebP | 400px, 80% |
| `fotopost` | 5MB | JPG, PNG, WebP | 1200px, 70% |
| `fotodecapa` | 3MB | JPG, PNG, WebP | 800px, 90% |
| `logotipo` | 1MB | JPG, PNG, WebP | 800px, 90% |

## 🚀 **Como Configurar**

### **Passo 1: Acessar Storage**
1. Vá para o Supabase Dashboard
2. Clique em "Storage" no menu lateral
3. Verifique se os 4 buckets estão criados

### **Passo 2: Configurar Políticas**
1. Para cada bucket, clique em "Policies"
2. Adicione as políticas SQL acima
3. Salve as configurações

### **Passo 3: Testar Upload**
1. Use o componente `ImageUpload` no frontend
2. Teste upload de diferentes tipos de imagem
3. Verifique se as URLs públicas funcionam

## 📱 **Integração no Frontend**

### **1. Hook `useStorage`**
```typescript
import { useStorage } from '@/hooks/useStorage'

const { 
  uploadProfilePhoto, 
  uploadPostPhoto,
  uploadCoverPhoto,
  uploadLogo 
} = useStorage()
```

### **2. Componente `ImageUpload`**
```typescript
import { ImageUpload } from '@/components/ImageUpload'

<ImageUpload
  bucket="fotoperfil"
  onUploadComplete={(url) => setProfilePhoto(url)}
  onRemove={() => setProfilePhoto(null)}
  currentImage={profilePhoto}
  aspectRatio="square"
  maxSize={2}
/>
```

## 🎯 **Casos de Uso**

### **1. Foto de Perfil (Cadastro)**
```typescript
<ImageUpload
  bucket="fotoperfil"
  onUploadComplete={(url) => setProfilePhoto(url)}
  aspectRatio="square"
  maxSize={2}
/>
```

### **2. Foto de Post (BeautyWall)**
```typescript
<ImageUpload
  bucket="fotopost"
  onUploadComplete={(url) => setPostImage(url)}
  aspectRatio="video"
  maxSize={5}
/>
```

### **3. Foto de Capa (Perfil do Salão)**
```typescript
<ImageUpload
  bucket="fotodecapa"
  onUploadComplete={(url) => setCoverPhoto(url)}
  aspectRatio="video"
  maxSize={3}
/>
```

### **4. Logotipo (Perfil do Salão)**
```typescript
<ImageUpload
  bucket="logotipo"
  onUploadComplete={(url) => setLogo(url)}
  aspectRatio="square"
  maxSize={1}
/>
```

## 🔒 **Segurança**

### **Validações Implementadas:**
- ✅ **Tamanho máximo** por tipo de bucket
- ✅ **Formatos permitidos** (JPG, PNG, WebP)
- ✅ **Compressão automática** para otimização
- ✅ **Nomes únicos** para evitar conflitos
- ✅ **RLS ativo** para controle de acesso

### **Boas Práticas:**
- 🔒 Sempre validar arquivos no frontend
- 🔒 Comprimir imagens antes do upload
- 🔒 Usar URLs públicas apenas para conteúdo público
- 🔒 Implementar limpeza automática de arquivos não utilizados

## 📊 **Monitoramento**

### **Métricas Importantes:**
- 📈 **Uso de storage** por bucket
- 📈 **Número de uploads** por dia
- 📈 **Tamanho médio** dos arquivos
- 📈 **Erros de upload** e suas causas

### **Alertas Recomendados:**
- ⚠️ **Storage > 80%** de capacidade
- ⚠️ **Uploads falhando** > 5% do total
- ⚠️ **Arquivos muito grandes** > limite configurado

## 🎉 **Benefícios Implementados**

- ✅ **Upload otimizado** com compressão automática
- ✅ **Interface intuitiva** com preview
- ✅ **Validação robusta** de arquivos
- ✅ **Segurança configurada** com RLS
- ✅ **Performance otimizada** com CDN
- ✅ **Mobile-first** com suporte à câmera

---

**🎯 Sistema de Storage configurado e pronto para uso!** 