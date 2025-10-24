# Multi-stage build for optimized container
FROM node:18-alpine AS frontend-builder

# Build frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Copy .env.local if it exists (optional)
RUN touch .env.local
RUN npm run build

# Python backend with Node.js for serving static files
FROM python:3.13-slim

# Install Node.js, curl, and ca-certificates for SSL
RUN apt-get update && apt-get install -y \
    curl \
    bash \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Update certifi to latest version for SSL certificates
RUN pip install --upgrade certifi

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./frontend/dist

# Install serve for hosting the frontend
RUN npm install -g serve

# Copy startup script
COPY docker-start.sh /app/docker-start.sh
RUN chmod +x /app/docker-start.sh

# Expose ports
EXPOSE 5173 5001

CMD ["/app/docker-start.sh"]
