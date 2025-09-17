@echo off
REM Script de Instalação de Dependências de Segurança - Beautycom
REM Execute este script para instalar todas as dependências necessárias

echo 🔒 Instalando dependências de segurança...

REM Instalar dependências do backend
echo 📦 Instalando dependências do backend...
cd backend
npm install express-rate-limit@^7.1.5 helmet@^7.1.0

REM Verificar se a instalação foi bem-sucedida
if %errorlevel% equ 0 (
    echo ✅ Dependências do backend instaladas com sucesso!
) else (
    echo ❌ Erro ao instalar dependências do backend
    pause
    exit /b 1
)

REM Voltar para o diretório raiz
cd ..

REM Verificar se o arquivo .env existe
if not exist ".env" (
    echo ⚠️  Arquivo .env não encontrado!
    echo 📝 Copiando env.example para .env...
    copy env.example .env
    echo ✅ Arquivo .env criado. Configure suas variáveis de ambiente!
) else (
    echo ✅ Arquivo .env já existe
)

REM Verificar se o arquivo .env.production existe
if not exist ".env.production" (
    echo ⚠️  Arquivo .env.production não encontrado!
    echo 📝 Crie o arquivo .env.production com suas configurações de produção
) else (
    echo ✅ Arquivo .env.production encontrado
)

echo.
echo 🎉 Instalação concluída!
echo.
echo 📋 Próximos passos:
echo 1. Configure suas variáveis de ambiente no arquivo .env
echo 2. Para produção, configure o arquivo .env.production
echo 3. Execute 'npm run build' para build de produção
echo 4. Configure seu servidor web (Nginx/Apache) com SSL
echo 5. Configure o Supabase com RLS habilitado
echo 6. Configure os webhooks do Stripe
echo.
echo 📖 Consulte o arquivo SECURITY_GUIDE.md para mais detalhes
pause
