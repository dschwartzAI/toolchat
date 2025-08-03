#!/bin/bash

# AI Business Tools Platform - LibreChat Setup Script
# This script sets up a customized LibreChat instance for business use

set -e  # Exit on error

echo "🚀 Starting AI Business Tools Platform Setup..."

# Check if LibreChat directory already exists
if [ -d "LibreChat" ]; then
    echo "⚠️  LibreChat directory already exists. Remove it to continue with fresh setup."
    read -p "Remove existing LibreChat directory? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf LibreChat
    else
        echo "Setup cancelled."
        exit 1
    fi
fi

# Clone LibreChat repository
echo "📦 Cloning LibreChat repository..."
git clone https://github.com/danny-avila/LibreChat.git

# Create necessary directories in LibreChat
echo "📁 Creating custom directories..."
mkdir -p LibreChat/client/src/localization
mkdir -p LibreChat/api/middleware
mkdir -p LibreChat/api/routes

# Copy our custom configuration files
echo "📝 Copying custom configuration files..."
if [ -f "LibreChat/librechat.yaml" ]; then
    cp LibreChat/librechat.yaml LibreChat/librechat.yaml.backup
fi
cp ../config/librechat.yaml LibreChat/librechat.yaml 2>/dev/null || echo "librechat.yaml will be created later"

if [ -f "LibreChat/.env" ]; then
    cp LibreChat/.env LibreChat/.env.backup
fi
cp ../config/.env LibreChat/.env 2>/dev/null || echo ".env will be created later"

# Create docker-compose.override.yml
echo "🐳 Creating Docker override configuration..."
cat > LibreChat/docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  api:
    environment:
      - MONGO_URI=mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI
      - SANDPACK_BUNDLER_URL=http://sandpack:3000
    volumes:
      - ./librechat.yaml:/app/librechat.yaml
      - ./client/src/localization/custom-en.json:/app/client/src/localization/custom-en.json
      - ./api/models/User.js:/app/api/models/User.js
      - ./api/middleware/tierAccess.js:/app/api/middleware/tierAccess.js
      - ./api/routes/admin.js:/app/api/routes/admin.js
    depends_on:
      - sandpack
  
  sandpack:
    image: codesandbox/sandpack-bundler:latest
    container_name: librechat-sandpack
    ports:
      - "3000:3000"
    restart: always

  nginx:
    image: nginx:alpine
    container_name: librechat-nginx
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: always
EOF

# Create a basic nginx configuration for SSL
echo "🔒 Creating nginx configuration..."
cat > LibreChat/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream librechat {
        server api:3080;
    }

    server {
        listen 80;
        server_name localhost;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name localhost;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://librechat;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# Create SSL directory
mkdir -p LibreChat/ssl

# Generate self-signed SSL certificate for local development
echo "🔐 Generating self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout LibreChat/ssl/key.pem \
    -out LibreChat/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Create check-setup.sh for validation
echo "✅ Creating validation script..."
cat > scripts/check-setup.sh << 'EOF'
#!/bin/bash

echo "🔍 Checking AI Business Tools Platform setup..."

# Check if LibreChat directory exists
if [ ! -d "LibreChat" ]; then
    echo "❌ LibreChat directory not found"
    exit 1
fi

# Check required files
required_files=(
    "LibreChat/docker-compose.yml"
    "LibreChat/docker-compose.override.yml"
    "LibreChat/nginx.conf"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    else
        echo "✅ Found: $file"
    fi
done

# Check if .env exists
if [ ! -f "LibreChat/.env" ]; then
    echo "⚠️  Warning: LibreChat/.env not found. Create it before running Docker."
fi

# Check if librechat.yaml exists
if [ ! -f "LibreChat/librechat.yaml" ]; then
    echo "⚠️  Warning: LibreChat/librechat.yaml not found. Create it before running Docker."
fi

echo "✅ Setup check completed!"
EOF

chmod +x scripts/check-setup.sh

echo "
✅ Initial setup complete!

Next steps:
1. Create LibreChat/.env with your API keys
2. Create LibreChat/librechat.yaml with your configuration
3. Run 'cd LibreChat && docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d'

Run './scripts/check-setup.sh' to verify your setup.
"