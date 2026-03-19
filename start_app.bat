@echo off
echo ==========================================
echo    Starting Campus Virtual Application
echo ==========================================

:: Start Backend
echo Starting Backend API...
start "Campus Virtual - Backend" cmd /k "cd backend && npm run start:dev"

:: Start Frontend
echo Starting Frontend App...
start "Campus Virtual - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Application servers are launching in new windows.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
pause
