@echo off
echo 🚀 Starting JSONL Viewer Development Environment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.9+ first.
    pause
    exit /b 1
)

echo 📋 Setting up backend...

REM Navigate to backend directory
cd backend

REM Check if virtual environment exists, create if not
if not exist ".venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call .venv\Scripts\activate.bat

REM Install backend dependencies
echo 📥 Installing backend dependencies...
pip install -r requirements.txt

REM Create .env if it doesn't exist
if not exist ".env" (
    echo ⚙️ Creating environment file...
    copy .env.example .env
    echo ✏️ Please edit .env file with your configuration
)

REM Start backend server
echo 🖥️ Starting backend server on http://localhost:8000...
start "Backend Server" cmd /k "call .venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Navigate to frontend directory
cd ..\frontend

echo 📋 Setting up frontend...

REM Install frontend dependencies
if not exist "node_modules" (
    echo 📥 Installing frontend dependencies...
    npm install
)

REM Start frontend server
echo 🌐 Starting frontend server on http://localhost:5173...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Development servers started successfully!
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🖥️ Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo Both servers are running in separate windows.
echo Close the command windows to stop the servers.
echo.

pause
