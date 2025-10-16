@echo off
setlocal enabledelayedexpansion

cls
echo.
echo ==========================================
echo    Building DegixDAW Desktop App
echo ==========================================
echo.

REM Clean build directory
if exist build\*.obj del /Q build\*.obj >nul 2>&1
if exist build\*.pdb del /Q build\*.pdb >nul 2>&1
if exist build\*.ilk del /Q build\*.ilk >nul 2>&1
if not exist build mkdir build

REM Find Visual Studio
set "VSPATH=C:\Program Files\Microsoft Visual Studio\2022\Community"
if not exist "%VSPATH%" set "VSPATH=C:\Program Files\Microsoft Visual Studio\2022\Professional"
if not exist "%VSPATH%" set "VSPATH=C:\Program Files\Microsoft Visual Studio\2022\Enterprise"

if not exist "%VSPATH%" (
    echo ERROR: Visual Studio 2022 not found!
    pause
    exit /b 1
)

REM Setup compiler
call "%VSPATH%\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1

REM Find source files
cd /d "e:\DegixDAW\desktop"
set "SOURCES="
set "FILE_COUNT=0"
for /r src %%f in (*.cpp) do (
    set "SOURCES=!SOURCES! "%%f""
    set /a FILE_COUNT+=1
)
echo Found %FILE_COUNT% source files
echo.

REM Compile
echo ==========================================
echo    Compiling...
echo ==========================================
echo.

cl.exe /nologo /Zi /EHsc /std:c++17 /DUNICODE /D_UNICODE /Fe:build\DegixDAW.exe /Fo:build\ !SOURCES! /Isrc /link winhttp.lib comctl32.lib user32.lib gdi32.lib gdiplus.lib ole32.lib shell32.lib kernel32.lib crypt32.lib /SUBSYSTEM:WINDOWS 2>&1 | findstr /v /c:"note:" /c:"with" /c:"[" /c:"]" /c:"_Elem" /c:"_Iter" /c:"_Size" /c:"_Alloc" /c:"_InIt" /c:"_OutIt" /c:"_Sent" /c:"Vorlage" /c:"Verweis" /c:"Instanziierung" /c:"kompilierte" /c:"gerade"

if %errorlevel% neq 0 (
    echo.
    color 0C
    echo ==========================================
    echo    BUILD FAILED!
    echo ==========================================
    echo.
    pause
    color 07
    exit /b 1
)

echo.
color 0A
echo ==========================================
echo    BUILD SUCCESSFUL!
echo ==========================================
echo.
echo Executable: build\DegixDAW.exe

REM File size
for %%A in (build\DegixDAW.exe) do set SIZE=%%~zA
set /a SIZE_KB=!SIZE! / 1024
echo File size: !SIZE_KB! KB
echo.

REM Start app
start "" "build\DegixDAW.exe"
echo Application started!
echo.
timeout /t 2 /nobreak >nul
pause
color 07
