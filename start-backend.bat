@echo off
echo ========================================================
echo Starting CareerFill Backend (Spring Boot on Port 8080)...
echo ========================================================
cd /d "%~dp0backend"

set "MVN_PATH=C:\Program Files\Apache\apache-maven-3.10.0-bin (1)\apache-maven-3.10.0\bin\mvn.cmd"
if exist "%MVN_PATH%" (
    call "%MVN_PATH%" spring-boot:run
) else (
    call mvn spring-boot:run
)
pause
