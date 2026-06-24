@echo off
:: Script de deploy automatico
:: Uso: push.cmd "mensagem do commit"

set MSG=%~1

if "%MSG%"=="" (
    echo Uso: push.cmd "descricao das alteracoes"
    echo Exemplo: push.cmd "adiciona nova pagina de contato"
    exit /b 1
)

echo.
echo [1/3] Adicionando todos os arquivos alterados...
git add .

echo [2/3] Criando commit: "%MSG%"
git commit -m "%MSG%"

echo [3/3] Enviando para o GitHub...
git push

echo.
echo PRONTO! Deploy automatico iniciado na Vercel.
echo Acesse: https://saas-mod.vercel.app
