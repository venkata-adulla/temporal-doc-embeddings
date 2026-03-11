#!/bin/bash
# Test if the server is responding locally in WSL

echo "Testing server connection from WSL..."
echo ""

# Test root endpoint
echo "1. Testing root endpoint (/)..."
curl -s http://localhost:8000/ || echo "Failed"

echo ""
echo "2. Testing health endpoint (/health)..."
curl -s http://localhost:8000/health || echo "Failed"

echo ""
echo "3. Testing with 127.0.0.1..."
curl -s http://127.0.0.1:8000/health || echo "Failed"

echo ""
echo "Done!"
