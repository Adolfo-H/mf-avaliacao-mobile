@echo off
cls

cd /d C:\Projetos\mf-avaliacao-mobile

echo ========================================
echo MF Avaliacao Fisica - Ambiente Mobile
echo ========================================
echo.

echo Detectando IP atual...

for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "$c = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1; if ($c) { $c.IPv4Address.IPAddress }"`) do set LOCAL_IP=%%I

if "%LOCAL_IP%"=="" (
    echo.
    echo ERRO: Nao foi possivel detectar o endereco IPv4.
    echo.
    pause
    exit /b 1
)

echo IP encontrado: %LOCAL_IP%
echo.

echo Atualizando .env.local...

> .env.local echo EXPO_PUBLIC_API_URL=http://%LOCAL_IP%/api/v1

echo.
echo API configurada para:
echo http://%LOCAL_IP%/api/v1
echo.

echo Iniciando Expo...
echo.

npx expo start --lan -c

pause