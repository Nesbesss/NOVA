#!/bin/bash

echo "🎵 Minplay Docker Setup"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker is installed"
echo ""
echo "Building and starting Minplay..."
echo ""

# Build and start
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Minplay is running!"
    echo ""
    echo "🌐 Open your browser and go to:"
    echo "   http://localhost:5173"
    echo ""
    echo "📊 Backend API:"
    echo "   http://localhost:5001/api/health"
    echo ""
    echo "📝 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop the app:"
    echo "   docker-compose down"
else
    echo ""
    echo "❌ Failed to start Minplay"
    echo "Check the logs with: docker-compose logs"
fi
