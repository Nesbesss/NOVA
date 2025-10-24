#!/bin/bash

echo "🌟 Starting Nova - Your Free Music Player..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose down 2>/dev/null || true

# Build and start the container
echo "🔨 Building and starting Nova..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 5

# Check if services are running
if docker ps | grep -q nova-app; then
    echo ""
    echo "✅ Nova is running!"
    echo ""
    echo "   🎵 Open your browser to: http://localhost:5173"
    echo ""
    echo "   To stop Nova, run: docker-compose down"
    echo "   To view logs, run: docker-compose logs -f"
    echo ""
else
    echo ""
    echo "❌ Failed to start Nova. Check the logs:"
    echo "   docker-compose logs"
    exit 1
fi
