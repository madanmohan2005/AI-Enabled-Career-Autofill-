@echo off
echo ========================================================
echo Starting CareerFill AI Service (FastAPI on Port 8000)...
echo ========================================================
cd /d "%~dp0ai-service"
call .\venv\Scripts\activate.bat
.\venv\Scripts\python.exe main.py
pause
