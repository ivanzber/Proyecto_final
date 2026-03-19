# ====================================================
# Script de Inicializacion de Base de Datos MySQL
# Campus Virtual UDEC - Windows PowerShell
# SOLO EJECUTAR UNA VEZ - No borra datos existentes
# ====================================================

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Campus Virtual UDEC - Setup MySQL" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que MySQL este instalado
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue

if (-not $mysqlPath) {
    Write-Host "ERROR: MySQL no esta instalado o no esta en el PATH" -ForegroundColor Red
    Write-Host "Por favor instala MySQL 8.0+ desde: https://dev.mysql.com/downloads/installer/" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK - MySQL encontrado: $($mysqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Solicitar credenciales
$mysqlUser = Read-Host "Usuario MySQL (default: root)"
if ([string]::IsNullOrWhiteSpace($mysqlUser)) {
    $mysqlUser = "root"
}

$mysqlPass = Read-Host "Password MySQL" -AsSecureString
$mysqlPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPass))

Write-Host ""
Write-Host "Verificando si la base de datos ya existe..." -ForegroundColor Yellow

# Verificar si la base de datos existe
$checkDb = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'campus_virtual';" | mysql -u $mysqlUser --password="$mysqlPassPlain" -N 2>$null

if ($checkDb -eq "campus_virtual") {
    Write-Host ""
    Write-Host "ADVERTENCIA: La base de datos 'campus_virtual' ya existe" -ForegroundColor Yellow
    $response = Read-Host "¿Deseas ELIMINAR todos los datos y recrear la base de datos? (S/N)"
    
    if ($response -ne "S" -and $response -ne "s") {
        Write-Host "Operación cancelada. La base de datos existente se mantiene intacta." -ForegroundColor Green
        exit 0
    }
    
    Write-Host "Eliminando base de datos existente..." -ForegroundColor Red
}

Write-Host ""
Write-Host "Ejecutando schema.sql..." -ForegroundColor Yellow

# Ejecutar schema.sql
$schemaPath = Join-Path -Path $PSScriptRoot -ChildPath "..\database\schema.sql"
if (-not (Test-Path $schemaPath)) {
    Write-Host "ERROR: No se encuentra schema.sql en $schemaPath" -ForegroundColor Red
    exit 1
}

try {
    $output = Get-Content $schemaPath | mysql -u $mysqlUser --password="$mysqlPassPlain" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK - Schema creado exitosamente" -ForegroundColor Green
    }
    else {
        Write-Host "MySQL Output:" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        throw "Error al ejecutar schema.sql"
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Ejecutando seeds.sql..." -ForegroundColor Yellow

# Ejecutar seeds.sql
$seedsPath = Join-Path -Path $PSScriptRoot -ChildPath "..\database\seeds.sql"
if (-not (Test-Path $seedsPath)) {
    Write-Host "ERROR: No se encuentra seeds.sql en $seedsPath" -ForegroundColor Red
    exit 1
}

try {
    $output = Get-Content $seedsPath | mysql -u $mysqlUser --password="$mysqlPassPlain" campus_virtual 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK - Datos de prueba insertados exitosamente" -ForegroundColor Green
    }
    else {
        Write-Host "MySQL Output:" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        throw "Error al ejecutar seeds.sql"
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "Base de datos configurada!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor Cyan
Write-Host "  Email: admin@udec.edu.co" -ForegroundColor White
Write-Host "  Password: Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE: Los datos ahora persisten entre reinicios." -ForegroundColor Yellow
Write-Host "Solo ejecuta este script nuevamente si quieres RESETEAR la base de datos." -ForegroundColor Yellow
Write-Host ""
