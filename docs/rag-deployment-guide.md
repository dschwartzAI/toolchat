# LibreChat RAG System Production Deployment Guide

This guide provides comprehensive instructions for deploying LibreChat with the native RAG system in a production environment, focusing on security, reliability, and performance.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Security Hardening](#security-hardening)
6. [Performance Optimization](#performance-optimization)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Backup & Recovery](#backup--recovery)
10. [Scaling Considerations](#scaling-considerations)

## Overview

The LibreChat RAG system consists of:
- **LibreChat Application**: Main web interface and API
- **pgVector Database**: PostgreSQL with vector extension for embeddings
- **RAG API**: FastAPI service for document processing and retrieval
- **MongoDB**: User data and conversation storage
- **Nginx**: Reverse proxy with SSL termination

### Architecture Diagram
```
[Users] → [Nginx:443] → [LibreChat:3080] → [RAG API:8000] → [pgVector:5433]
                           ↓
                      [MongoDB:27017]
```

## Prerequisites

### Hardware Requirements
- **Minimum**: 4 CPU cores, 8GB RAM, 100GB SSD
- **Recommended**: 8 CPU cores, 16GB RAM, 500GB SSD
- **Network**: Stable internet, opened ports (80, 443)

### Software Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Docker 20.10+ and Docker Compose 2.0+
- Git, curl, jq installed
- Domain name with DNS configured
- SSL certificates (Let's Encrypt recommended)

### API Keys Required
- OpenAI API key (for embeddings)
- OpenAI/Anthropic API keys (for chat endpoints)

## Pre-Deployment Checklist

- [ ] Server provisioned with adequate resources
- [ ] Domain name pointing to server IP
- [ ] Firewall configured (ports 80, 443 open)
- [ ] SSH access secured (key-based auth)
- [ ] Backup solution in place
- [ ] Monitoring tools ready
- [ ] API keys obtained and secured

## Step-by-Step Deployment

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y git curl jq nginx certbot python3-certbot-nginx

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

### 2. Clone and Configure Project

```bash
# Create application directory
sudo mkdir -p /opt/librechat
sudo chown $USER:$USER /opt/librechat
cd /opt/librechat

# Clone repository
git clone https://github.com/your-repo/jk-ai.git .

# Navigate to LibreChat directory
cd LibreChat

# Copy production environment file
cp .env.production .env

# Generate secure passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '=')
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
CREDS_KEY=$(openssl rand -hex 32)
CREDS_IV=$(openssl rand -hex 16)

# Update .env with generated values
sed -i "s/change-this-secure-password/$POSTGRES_PASSWORD/" .env
sed -i "s/generate-a-secure-jwt-secret/$JWT_SECRET/" .env
sed -i "s/generate-another-secure-jwt-secret/$JWT_REFRESH_SECRET/" .env
sed -i "s/generate-32-byte-hex-key/$CREDS_KEY/" .env
sed -i "s/generate-16-byte-hex-key/$CREDS_IV/" .env
```

### 3. Configure SSL with Nginx

```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Update nginx configuration
sudo cp /opt/librechat/LibreChat/nginx.conf /etc/nginx/sites-available/librechat
sudo ln -s /etc/nginx/sites-available/librechat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configure Production Settings

```bash
# Use production LibreChat configuration
cp config/librechat.production.yaml librechat.yaml

# Update domain in .env
sed -i "s|https://yourdomain.com|https://yourdomain.com|g" .env

# Set production API keys
read -s -p "Enter OpenAI API key: " OPENAI_KEY
echo
sed -i "s/your-openai-api-key/$OPENAI_KEY/" .env

read -s -p "Enter RAG OpenAI API key: " RAG_OPENAI_KEY
echo
sed -i "s/your-openai-api-key/$RAG_OPENAI_KEY/" .env
```

### 5. Deploy RAG System

```bash
# Run automated setup script
../scripts/setup-rag.sh

# Start all services
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f --tail=100
```

### 6. Create Admin User

```bash
# Create initial admin user
docker exec -it LibreChat npm run create-user -- \
  --email admin@yourdomain.com \
  --password "SecureAdminPassword" \
  --name "Admin User" \
  --role admin
```

### 7. Upload Knowledge Base

```bash
# Set environment variables
export RAG_API_URL=http://localhost:8000
export RAG_API_KEY=$(grep RAG_API_KEY .env | cut -d'=' -f2)

# Upload knowledge base
../scripts/upload-knowledge-base.sh /path/to/knowledge-base

# Note the vector store ID and update .env
VECTOR_STORE_ID=vs_generated_id
echo "DARKJK_VECTOR_STORE_ID=$VECTOR_STORE_ID" >> .env

# Restart services to apply changes
docker-compose restart api
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Environment Security

```bash
# Secure environment file
chmod 600 .env
chmod 600 .env.production

# Create secure backup
mkdir -p ~/backups/env
cp .env ~/backups/env/.env.$(date +%Y%m%d)
chmod 700 ~/backups
```

### 3. Docker Security

```bash
# Enable Docker content trust
export DOCKER_CONTENT_TRUST=1

# Configure Docker daemon
sudo tee /etc/docker/daemon.json <<EOF
{
  "icc": false,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "userland-proxy": false
}
EOF

sudo systemctl restart docker
```

### 4. Database Security

```bash
# Connect to PostgreSQL
docker exec -it librechat-vectordb psql -U librechat

# Create read-only user for monitoring
CREATE USER monitoring WITH PASSWORD 'monitoring_password';
GRANT CONNECT ON DATABASE librechat_vectors TO monitoring;
GRANT USAGE ON SCHEMA public TO monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;
```

## Performance Optimization

### 1. pgVector Optimization

```sql
-- Connect to database
docker exec -it librechat-vectordb psql -U librechat -d librechat_vectors

-- Optimize for your workload
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET random_page_cost = 1.1;

-- Create indexes for better performance
CREATE INDEX idx_embeddings_metadata ON embeddings USING gin(metadata);
CREATE INDEX idx_embeddings_created ON embeddings(created_at);
```

### 2. RAG API Optimization

Update `.env`:
```bash
# Optimize chunk processing
CHUNK_SIZE=256          # Smaller chunks for faster retrieval
CHUNK_OVERLAP=64        # Less overlap for efficiency
MAX_WORKERS=4           # Parallel processing workers
BATCH_SIZE=10           # Process files in batches

# Connection pooling
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10
```

### 3. Nginx Caching

Add to nginx configuration:
```nginx
# Enable caching for static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 10240;
gzip_proxied expired no-cache no-store private auth;
gzip_types text/plain text/css text/xml application/json application/javascript;
```

## Monitoring & Maintenance

### 1. Set Up Monitoring

```bash
# Install monitoring stack
docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# Access Grafana at http://localhost:3000
# Default: admin/admin
```

### 2. Log Management

```bash
# Create log rotation configuration
sudo tee /etc/logrotate.d/librechat <<EOF
/opt/librechat/LibreChat/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 librechat librechat
    sharedscripts
    postrotate
        docker-compose -f /opt/librechat/LibreChat/docker-compose.yml kill -s USR1 api
    endscript
}
EOF
```

### 3. Health Checks

Create `health-check.sh`:
```bash
#!/bin/bash
# Health check script

# Check services
services=("api" "vectordb" "rag_api" "mongodb")
for service in "${services[@]}"; do
    if ! docker-compose ps $service | grep -q "Up"; then
        echo "ERROR: $service is down"
        # Send alert (email, Slack, etc.)
    fi
done

# Check RAG API
if ! curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "ERROR: RAG API health check failed"
fi

# Check disk space
if [ $(df -h / | awk 'NR==2 {print $(NF-1)}' | sed 's/%//') -gt 80 ]; then
    echo "WARNING: Disk usage above 80%"
fi
```

Add to crontab:
```bash
*/5 * * * * /opt/librechat/health-check.sh >> /var/log/librechat-health.log 2>&1
```

## Troubleshooting

### Common Issues and Solutions

#### 1. RAG API Connection Issues
```bash
# Check RAG API logs
docker logs librechat-rag-api --tail 100

# Test connectivity
docker exec LibreChat curl http://rag_api:8000/health

# Restart services
docker-compose restart rag_api api
```

#### 2. Vector Search Not Working
```bash
# Check vector store
curl http://localhost:8000/vector-stores/$VECTOR_STORE_ID

# Verify embeddings
docker exec -it librechat-vectordb psql -U librechat -d librechat_vectors \
  -c "SELECT COUNT(*) FROM embeddings;"

# Reindex if needed
docker exec librechat-rag-api python scripts/reindex.py
```

#### 3. High Memory Usage
```bash
# Check memory usage
docker stats --no-stream

# Limit container memory
# Add to docker-compose.override.yml:
services:
  rag_api:
    mem_limit: 2g
    mem_reservation: 1g
```

#### 4. Slow Response Times
```bash
# Profile RAG queries
docker exec librechat-rag-api python -m cProfile scripts/profile_search.py

# Check PostgreSQL query performance
docker exec -it librechat-vectordb psql -U librechat -d librechat_vectors \
  -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

## Backup & Recovery

### 1. Automated Backup Script

Create `backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/backup/librechat/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker exec mongodb mongodump --out /dump
docker cp mongodb:/dump $BACKUP_DIR/mongodb

# Backup pgVector
docker exec librechat-vectordb pg_dump -U librechat librechat_vectors \
  > $BACKUP_DIR/pgvector.sql

# Backup configuration
cp -r /opt/librechat/LibreChat/.env $BACKUP_DIR/
cp -r /opt/librechat/LibreChat/librechat.yaml $BACKUP_DIR/
cp -r /opt/librechat/LibreChat/uploads $BACKUP_DIR/

# Compress
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Keep only last 30 days
find /backup/librechat -name "*.tar.gz" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /opt/librechat/backup.sh >> /var/log/librechat-backup.log 2>&1
```

### 2. Recovery Procedure

```bash
# Stop services
docker-compose down

# Extract backup
tar -xzf /backup/librechat/20240101.tar.gz -C /tmp

# Restore MongoDB
docker-compose up -d mongodb
docker cp /tmp/20240101/mongodb mongodb:/dump
docker exec mongodb mongorestore --drop /dump

# Restore pgVector
docker-compose up -d vectordb
docker exec -i librechat-vectordb psql -U librechat librechat_vectors \
  < /tmp/20240101/pgvector.sql

# Restore configuration
cp /tmp/20240101/.env /opt/librechat/LibreChat/
cp -r /tmp/20240101/uploads /opt/librechat/LibreChat/

# Start all services
docker-compose up -d
```

## Scaling Considerations

### 1. Horizontal Scaling

For high traffic, deploy multiple LibreChat instances:

```yaml
# docker-compose.scale.yml
services:
  api:
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
      - CLUSTER_MODE=true
```

### 2. Database Scaling

#### PostgreSQL Replication
```bash
# Set up streaming replication for pgVector
# Master configuration
docker exec -it librechat-vectordb bash
echo "wal_level = replica" >> /var/lib/postgresql/data/postgresql.conf
echo "max_wal_senders = 3" >> /var/lib/postgresql/data/postgresql.conf
```

#### Use Managed Services
For production, consider:
- AWS RDS with pgVector extension
- Google Cloud SQL for PostgreSQL
- Azure Database for PostgreSQL

### 3. CDN Integration

```nginx
# Configure CDN for static assets
location /images/ {
    proxy_pass https://cdn.yourdomain.com/images/;
    proxy_cache_valid 200 30d;
}
```

## Performance Metrics to Monitor

1. **System Metrics**
   - CPU usage per container
   - Memory consumption
   - Disk I/O and space
   - Network throughput

2. **Application Metrics**
   - Request response times
   - Concurrent users
   - Chat completion times
   - Error rates

3. **RAG Metrics**
   - Embedding generation time
   - Vector search latency
   - Document processing queue
   - Storage growth rate

4. **Database Metrics**
   - Query performance
   - Connection pool usage
   - Index efficiency
   - Replication lag

## Security Updates

```bash
# Regular update schedule
# Create update.sh
#!/bin/bash
cd /opt/librechat/LibreChat

# Backup before update
./backup.sh

# Pull latest changes
git pull origin main

# Update containers
docker-compose pull
docker-compose up -d

# Run migrations if needed
docker exec LibreChat npm run migrate
```

## Conclusion

This deployment guide provides a comprehensive approach to running LibreChat with RAG in production. Key points:

1. **Security First**: Always use HTTPS, secure passwords, and regular updates
2. **Monitor Everything**: Set up comprehensive monitoring from day one
3. **Backup Regularly**: Automate backups and test recovery procedures
4. **Plan for Scale**: Design with growth in mind
5. **Document Changes**: Keep deployment documentation updated

For additional support:
- Check LibreChat documentation: https://www.librechat.ai/docs
- Review RAG API docs: https://github.com/danny-avila/rag_api
- Monitor community forums for updates

Remember: Production deployment is an iterative process. Start with this guide, monitor performance, and optimize based on your specific needs.