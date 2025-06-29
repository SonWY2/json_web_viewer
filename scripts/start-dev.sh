#!/bin/bash

# JSONL Viewer Development Server Startup Script

echo "🚀 Starting JSONL Viewer Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.9+ first."
    exit 1
fi

# Set Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
else
    PYTHON_CMD=python
fi

echo "📋 Setting up backend..."

# Navigate to backend directory
cd backend

# Check if virtual environment exists, create if not
if [ ! -d ".venv" ]; then
    echo "📦 Creating Python virtual environment..."
    $PYTHON_CMD -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash)
    source .venv/Scripts/activate
else
    # macOS/Linux
    source .venv/bin/activate
fi

# Install backend dependencies
echo "📥 Installing backend dependencies..."
pip install -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating environment file..."
    cp .env.example .env
    echo "✏️ Please edit .env file with your configuration"
fi

# Start backend server in background
echo "🖥️ Starting backend server on http://localhost:8000..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Navigate to frontend directory
cd ../frontend

echo "📋 Setting up frontend..."

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

# Start frontend server
echo "🌐 Starting frontend server on http://localhost:5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started successfully!"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🖥️ Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped successfully"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for user interrupt
wait
