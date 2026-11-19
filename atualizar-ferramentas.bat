@echo off
setlocal
REM Atalho local (opcional): registra no index.html as ferramentas novas da pasta tools.
REM Pode ser bloqueado pela politica de seguranca da empresa - nesse caso, use o GitHub (veja o LEIA-ME).
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado neste computador.
  echo Use o caminho pelo GitHub: coloque o arquivo em tools/ no github.com e o painel online se atualiza sozinho.
  pause
  exit /b 1
)

node scripts\atualizar-ferramentas.mjs %*
echo.
pause
