#!/bin/bash

echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "Installing Node dependencies..."
npm install

echo "Building frontend..."
npm run build

echo "Starting backend..."
cd backend
python app.py &
BACKEND_PID=$!

cd ..
echo "Starting frontend server..."
npx serve -s dist -l ${PORT:-8080}

wait $BACKEND_PID
