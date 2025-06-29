#!/bin/bash

# JSONL Viewer Initial Setup Script

echo "🔧 JSONL Viewer Initial Setup"
echo "==============================="

# Check system requirements
echo "🔍 Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "📥 Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js found: $NODE_VERSION"
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
    PYTHON_VERSION=$(python3 --version)
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
    PYTHON_VERSION=$(python --version)
else
    echo "❌ Python is not installed."
    echo "📥 Please install Python 3.9+ from: https://python.org/"
    exit 1
fi
echo "✅ Python found: $PYTHON_VERSION"

# Check pip
if ! command -v pip &> /dev/null; then
    echo "❌ pip is not installed."
    echo "📥 Please install pip first."
    exit 1
else
    echo "✅ pip found"
fi

echo ""
echo "📦 Setting up project dependencies..."

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "📦 Creating Python virtual environment..."
    $PYTHON_CMD -m venv .venv
else
    echo "✅ Virtual environment already exists"
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

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install backend dependencies
echo "📥 Installing backend dependencies..."
pip install -r requirements.txt

# Create environment file
if [ ! -f ".env" ]; then
    echo "⚙️ Creating environment configuration..."
    cp .env.example .env
    echo "✏️ Environment file created at backend/.env"
    echo "   Please edit it with your configuration before running the application."
else
    echo "✅ Environment file already exists"
fi

# Setup frontend
echo ""
echo "🌐 Setting up frontend..."
cd ../frontend

# Install frontend dependencies
echo "📥 Installing frontend dependencies..."
npm install

# Create uploads directory
echo "📁 Creating necessary directories..."
mkdir -p ../backend/uploads
mkdir -p ../backend/cache

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env file with your configuration"
echo "2. Run './scripts/start-dev.sh' to start development servers"
echo "   Or run './scripts/start-dev.bat' on Windows"
echo ""
echo "📚 Useful commands:"
echo "   Backend only: cd backend && uvicorn main:app --reload"
echo "   Frontend only: cd frontend && npm run dev"
echo ""
echo "🌐 After starting:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/docs"
echo ""
echo "❓ Need help? Check README.md or create an issue on GitHub"
