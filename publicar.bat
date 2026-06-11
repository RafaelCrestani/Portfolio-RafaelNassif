@echo off
REM ============================================================
REM  Publica o portfolio temporariamente na internet
REM  (Cloudflare quick tunnel - sem conta, URL muda a cada uso)
REM ============================================================
cd /d "%~dp0"

echo Iniciando servidor local na porta 8788...
start "portfolio-server" /min python -m http.server 8788 --bind 127.0.0.1

echo Abrindo tunel publico (procure a URL *.trycloudflare.com abaixo)...
echo.
tools\cloudflared.exe tunnel --url http://127.0.0.1:8788 --no-autoupdate

REM Ao fechar esta janela, o site sai do ar (o servidor local continua;
REM feche a janela "portfolio-server" minimizada para parar tudo).
