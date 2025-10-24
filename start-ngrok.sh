#!/bin/bash

echo "🚀 Starting Nova with ngrok..."
echo ""

cd /Volumes/MyNVME/minplay

echo "📦 Starting backend..."
export SSL_CERT_FILE=/Volumes/MyNVME/minplay/.venv/lib/python3.13/site-packages/certifi/cacert.pem
cd backend
/Volumes/MyNVME/minplay/.venv/bin/python app.py &
BACKEND_PID=$!
cd ..

echo "⏳ Waiting for backend to start..."
sleep 3

echo "🌐 Starting ngrok tunnels (backend + frontend)..."
ngrok start backend frontend --config=ngrok.yml --config="$HOME/Library/Application Support/ngrok/ngrok.yml" --log=stdout > ngrok.log &
NGROK_PID=$!

echo "⏳ Waiting for ngrok tunnels..."
sleep 5

BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | grep backend -A1 | tail -1)
if [ -z "$BACKEND_URL" ]; then
    BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.config.addr | contains("5001")) | .public_url')
fi

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Failed to get backend ngrok URL"
    kill $BACKEND_PID $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend URL: $BACKEND_URL"

echo "📝 Creating .env.local with backend URL..."
cat > .env.local << EOF
VITE_BACKEND_URL=$BACKEND_URL
VITE_REDIRECT_URI=http://127.0.0.1:5173
VITE_USE_YTMUSIC=true
EOF

echo "🎨 Building frontend..."
npm run build

echo "🌐 Starting frontend server on port 5173..."
npx serve -s dist -l 5173 &
FRONTEND_PID=$!

echo "⏳ Waiting for frontend to start..."
sleep 3

FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | grep frontend -A1 | tail -1)
if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.config.addr | contains("5173")) | .public_url')
fi

if [ -z "$FRONTEND_URL" ]; then
    echo "❌ Failed to get frontend ngrok URL"
    kill $BACKEND_PID $FRONTEND_PID $NGROK_PID 2>/dev/null
    exit 1
fi

echo ""
echo "✅ Nova is running with ngrok!"
echo ""
echo "   🎵 Frontend: $FRONTEND_URL"
echo "   🔌 Backend:  $BACKEND_URL"
echo ""
echo "🌍 Share this URL with your friend: $FRONTEND_URL"
echo ""
echo "Press Ctrl+C to stop all services"

cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID $NGROK_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
