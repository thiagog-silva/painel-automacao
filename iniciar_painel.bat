@echo off
setlocal
REM Duplo-clique neste arquivo (Windows) pra abrir o Painel de Automacao.
REM Ele sobe um servidor local so pra esta pasta e abre o navegador.
cd /d "%~dp0"
set PORT=8790

where python >nul 2>nul
if %errorlevel%==0 (
  echo Abrindo o painel em http://127.0.0.1:%PORT%/ ...
  start "" http://127.0.0.1:%PORT%/index.html
  python -m http.server %PORT%
  goto :fim
)

where py >nul 2>nul
if %errorlevel%==0 (
  echo Abrindo o painel em http://127.0.0.1:%PORT%/ ...
  start "" http://127.0.0.1:%PORT%/index.html
  py -m http.server %PORT%
  goto :fim
)

where npx >nul 2>nul
if %errorlevel%==0 (
  echo Abrindo o painel em http://127.0.0.1:%PORT%/ ...
  start "" http://127.0.0.1:%PORT%/index.html
  npx --yes serve -l %PORT% .
  goto :fim
)

echo ============================================================
echo Nao encontrei Python nem Node instalado neste computador.
echo.
echo Pra abrir o painel, instale o Python (basta um download rapido
echo em https://www.python.org/downloads/ marcando a opcao
echo "Add python.exe to PATH" na instalacao) e de duplo-clique
echo neste arquivo de novo.
echo ============================================================

:fim
echo.
echo Se essa janela fechou sozinha ou mostrou um erro acima, isso
echo geralmente significa que falta instalar o Python (veja a
echo mensagem acima). Deixe esta janela ABERTA enquanto usa o painel
echo — fechar ela desliga o servidor local.
pause
