# ====================================================
# Script de Inicio - Modo Desarrollo
# Campus Virtual UDEC - Windows PowerShell
# ====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Campus Virtual UDEC - Inicio Desarrollo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Funcion para verificar si un puerto esta en uso
function Test-Port {
    param([int]$Port)
    $connection = New-Object System.Net.Sockets.TcpClient
    try {
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Verificar Node.js
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "ERROR: Node.js no esta instalado" -ForegroundColor Red
    Write-Host "Instala Node.js 18+ desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK - Node.js encontrado: $(node --version)" -ForegroundColor Green

# Verificar puertos
if (Test-Port 3000) {
    Write-Host "ADVERTENCIA: El puerto 3000 ya esta en uso" -ForegroundColor Yellow
    $continue = Read-Host "Continuar de todas formas? (s/n)"
    if ($continue -ne "s") {
        exit 0
    }
}

if (Test-Port 5173) {
    Write-Host "ADVERTENCIA: El puerto 5173 ya esta en uso" -ForegroundColor Yellow
    $continue = Read-Host "Continuar de todas formas? (s/n)"
    if ($continue -ne "s") {
        exit 0
    }
}

Write-Host ""
Write-Host "=== Configurando Backend ===" -ForegroundColor Cyan

# Verificar y crear .env en backend
$backendEnvPath = ".\backend\.env"
if (-not (Test-Path $backendEnvPath)) {
    Write-Host "Creando backend\.env desde .env.example..." -ForegroundColor Yellow
    Copy-Item ".\backend\.env.example" $backendEnvPath
    Write-Host "OK - Archivo creado. Por favor edita backend\.env con tus credenciales de MySQL" -ForegroundColor Green
    Write-Host ""
    $continue = Read-Host "Presiona Enter cuando hayas configurado backend\.env"
}

# Verificar node_modules en backend
if (-not (Test-Path ".\backend\node_modules")) {
    Write-Host "Instalando dependencias del backend..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
    Write-Host "OK - Dependencias instaladas" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Configurando Frontend ===" -ForegroundColor Cyan

# Verificar y crear .env en frontend
$frontendEnvPath = ".\frontend\.env"
if (-not (Test-Path $frontendEnvPath)) {
    Write-Host "Creando frontend\.env desde .env.example..." -ForegroundColor Yellow
    Copy-Item ".\frontend\.env.example" $frontendEnvPath
    Write-Host "OK - Archivo creado" -ForegroundColor Green
}

# Verificar node_modules en frontend
if (-not (Test-Path ".\frontend\node_modules")) {
    Write-Host "Instalando dependencias del frontend..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
    Write-Host "OK - Dependencias instaladas" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Iniciando servidores..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Swagger Docs: http://localhost:3000/api/docs" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C en cualquier ventana para detener los servidores" -ForegroundColor Yellow
Write-Host ""

# Iniciar backend en nueva ventana de PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'Iniciando Backend...' -ForegroundColor Green; npm run start:dev"

# Esperar 3 segundos antes de iniciar frontend
Start-Sleep -Seconds 3

# Iniciar frontend en nueva ventana de PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Iniciando Frontend...' -ForegroundColor Green; npm run dev"

Write-Host "OK - Servidores iniciados en ventanas separadas" -ForegroundColor Green
Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor Cyan
Write-Host "  Email: admin@udec.edu.co" -ForegroundColor White
Write-Host "  Password: Admin123!" -ForegroundColor White
Write-Host ""
