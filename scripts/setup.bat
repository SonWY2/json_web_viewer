@echo off
REM JSONL Viewer Development Setup Script for Windows

echo 🚀 Setting up JSONL Viewer...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Setup backend
echo 📦 Setting up backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Copy environment file
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
)

echo ✅ Backend setup complete

REM Setup frontend
echo 📦 Setting up frontend...
cd ..\frontend

REM Install Node.js dependencies
echo Installing Node.js dependencies...
npm install

echo ✅ Frontend setup complete

echo.
echo 🎉 Setup complete! To start the application:
echo.
echo 1. Start backend (in one terminal):
echo    cd backend
echo    venv\Scripts\activate.bat
echo    python main.py
echo.
echo 2. Start frontend (in another terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 3. Open http://localhost:3000 in your browser
echo.
echo 📊 Happy data exploring!
pause
