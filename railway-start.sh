#!/bin/bash

echo "🚀 Starting Nova on Railway..."

# Set SSL certificate path
export SSL_CERT_FILE=$(python -c "import certifi; print(certifi.where())")
export REQUESTS_CA_BUNDLE=$SSL_CERT_FILE

# Start backend in background
echo "📦 Starting backend..."
cd backend
python app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend..."
sleep 5

# Build frontend
echo "🎨 Building frontend..."
npm run build

# Start frontend server
echo "🌐 Starting frontend..."
npx serve -s dist -l $PORT

# Keep the script running
wait $BACKEND_PID
