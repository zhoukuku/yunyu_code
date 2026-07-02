@echo off
setlocal

echo ============================================
echo   C++ Compiler Installation (MinGW-w64 GCC)
echo ============================================
echo.

REM Check if g++ is already available
where g++ >nul 2>&1
if not errorlevel 1 (
    echo g++ is already installed:
    g++ --version
    echo.
    echo No action needed.
    pause
    exit /b 0
)

echo g++ not found. Installing via winget...

REM Check if winget is available
where winget >nul 2>&1
if errorlevel 1 (
    echo [ERROR] winget not found.
    echo Please install the App Installer from the Microsoft Store,
    echo or download MinGW-w64 manually from:
    echo   https://www.mingw-w64.org/downloads/
    pause
    exit /b 1
)

echo [1/2] Installing MSYS2 (includes MinGW-w64)...
winget install --id=MSYS2.MSYS2 -e --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
    echo [ERROR] MSYS2 installation failed.
    echo Please try installing manually from: https://www.msys2.org/
    pause
    exit /b 1
)

echo.
echo [2/2] Installing GCC toolchain...
set "MSYS2_PACMAN=C:\msys64\usr\bin\pacman.exe"
if exist "%MSYS2_PACMAN%" (
    "%MSYS2_PACMAN%" -S --noconfirm mingw-w64-ucrt-x86_64-gcc
    if errorlevel 1 (
        echo [WARNING] GCC installation via pacman failed.
        echo You may need to run this manually in an MSYS2 terminal:
        echo   pacman -S mingw-w64-ucrt-x86_64-gcc
    ) else (
        echo.
        echo ============================================
        echo   Installation complete!
        echo   Add to System PATH: C:\msys64\ucrt64\bin
        echo   Then restart your terminal and verify:
        echo     g++ --version
        echo ============================================
    )
) else (
    echo [WARNING] MSYS2 pacman not found at expected location.
    echo Expected: %MSYS2_PACMAN%
    echo You may need to install GCC manually within MSYS2.
)

echo.
pause
