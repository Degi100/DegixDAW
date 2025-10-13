@echo off
REM Just run the compiled executable
if not exist "build\DegixDAW.exe" (
    echo ERROR: Executable not found!
    echo Please run compile.bat first.
    pause
    exit /b 1
)

echo Starting DegixDAW Desktop App...
start "" "build\DegixDAW.exe"
