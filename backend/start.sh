#!/bin/bash
# Start the FastAPI backend server

cd "$(dirname "$0")"

# Activate virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Error: Virtual environment not found. Please create one first."
    exit 1
fi

# Check if port 8000 is available, use 8001 if not
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Port 8000 is in use. Starting on port 8001..."
    PORT=8001
else
    PORT=8000
fi

echo "Starting FastAPI server on port $PORT..."
echo "API will be available at: http://localhost:$PORT"
echo "API docs at: http://localhost:$PORT/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port $PORT
