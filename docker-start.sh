#!/bin/bash

# Set SSL certificate path for Python
export SSL_CERT_FILE=$(python -c "import certifi; print(certifi.where())")
export REQUESTS_CA_BUNDLE=$SSL_CERT_FILE

# Start Flask backend in background
echo "Starting Flask backend on port 5001..."
cd /app/backend
python app.py &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend server
echo "Starting frontend on port 5173..."
cd /app/frontend
serve -s dist -l 5173 &
FRONTEND_PID=$!

# Function to handle shutdown
shutdown() {
    echo "Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID
    exit 0
}

trap shutdown SIGTERM SIGINT

# Wait for both processes
echo "✅ Nova is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
