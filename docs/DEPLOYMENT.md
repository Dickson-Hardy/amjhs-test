# Deployment Guide

This guide covers deployment strategies for the AMHSJ platform across different environments and hosting providers.

## Overview

The AMHSJ platform can be deployed using various strategies:
- **Docker Compose** (Recommended for production)
- **Manual deployment** with PM2
- **Cloud platforms** (Vercel, AWS, Google Cloud)
- **Kubernetes** for enterprise scale

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- Network: 100Mbps

**Recommended:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+ SSD
- Network: 1Gbps

### Software Requirements

- Docker 20+ and Docker Compose 2+
- Node.js 18+ (for manual deployment)
- PostgreSQL 15+
- Redis 7+
- Nginx (for reverse proxy)

## Docker Deployment (Recommended)

### Production Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/amhsj-platform.git
   cd amhsj-platform
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.production
   ```

   Configure production environment variables:
   ```env
   # Application
   NODE_ENV=production
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=your-super-secret-key-min-32-chars
   
   # Database
   DATABASE_URL=postgresql://amhsj_user:secure_password@postgres:5432/amhsj
   POSTGRES_USER=amhsj_user
   POSTGRES_PASSWORD=secure_password
   POSTGRES_DB=amhsj
   
   # Redis
   REDIS_URL=redis://redis:6379
   
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=noreply@your-domain.com
   
   # File Storage (ImageKit)
   IMAGEKIT_PUBLIC_KEY=your_public_key
   IMAGEKIT_PRIVATE_KEY=your_private_key
   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
   
   # External Integrations
   DOI_PREFIX=10.1234
   CROSSREF_USERNAME=your_username
   CROSSREF_PASSWORD=your_password
   ORCID_CLIENT_ID=your_orcid_client_id
   ORCID_CLIENT_SECRET=your_orcid_client_secret
   
   # Monitoring
   SENTRY_DSN=your_sentry_dsn
   ```

3. **SSL Certificate Setup**
   ```bash
   # Create SSL directory
   mkdir -p ssl
   
   # Copy your SSL certificates
   cp your-domain.crt ssl/
   cp your-domain.key ssl/
   
   # Or use Let's Encrypt with Certbot
   sudo certbot certonly --webroot -w /var/www/html -d your-domain.com
   cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
   cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
   ```

4. **Update Nginx Configuration**
   ```bash
   # Edit nginx.conf for your domain
   nano nginx.conf
   ```

   Example configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
       
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
       ssl_prefer_server_ciphers off;
       
       location / {
           proxy_pass http://app:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Deploy with Docker Compose**
   ```bash
   # Build and start services
   docker-compose -f docker-compose.prod.yml up -d
   
   # Check service status
   docker-compose -f docker-compose.prod.yml ps
   
   # View logs
   docker-compose -f docker-compose.prod.yml logs -f app
   ```

6. **Initialize Database**
   ```bash
   # Run migrations
   docker-compose -f docker-compose.prod.yml exec app npm run migrate
   
   # Seed initial data
   docker-compose -f docker-compose.prod.yml exec app npm run seed
   
   # Create admin user
   docker-compose -f docker-compose.prod.yml exec app npm run create-admin
   ```

### Docker Compose Configuration

**docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

## Manual Deployment

### Server Setup

1. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt-get install -y postgresql postgresql-contrib
   
   # Install Redis
   sudo apt-get install -y redis-server
   
   # Install Nginx
   sudo apt-get install -y nginx
   
   # Install PM2
   sudo npm install -g pm2
   ```

2. **Database Setup**
   ```bash
   # Create database user
   sudo -u postgres createuser --interactive amhsj_user
   
   # Create database
   sudo -u postgres createdb amhsj
   
   # Set password
   sudo -u postgres psql -c "ALTER USER amhsj_user PASSWORD 'secure_password';"
   ```

3. **Application Deployment**
   ```bash
   # Clone repository
   git clone https://github.com/your-org/amhsj-platform.git
   cd amhsj-platform
   
   # Install dependencies
   npm ci --production
   
   # Build application
   npm run build
   
   # Run migrations
   npm run migrate
   
   # Seed data
   npm run seed
   ```

4. **PM2 Configuration**
   
   **ecosystem.config.js:**
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'amhsj-app',
         script: 'npm',
         args: 'start',
         instances: 'max',
         exec_mode: 'cluster',
         env: {
           NODE_ENV: 'production',
           PORT: 3000
         },
         error_file: './logs/err.log',
         out_file: './logs/out.log',
         log_file: './logs/combined.log',
         time: true,
         max_memory_restart: '1G',
         node_args: '--max_old_space_size=4096'
       }
     ]
   }
   ```

5. **Start Application**
   ```bash
   # Start with PM2
   pm2 start ecosystem.config.js
   
   # Save PM2 configuration
   pm2 save
   
   # Setup PM2 startup
   pm2 startup
   sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
   ```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/amhsj
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/amhsj /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Cloud Platform Deployments

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure Project**
   
   **vercel.json:**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "framework": "nextjs",
     "installCommand": "npm install",
     "functions": {
       "app/api/**/*.ts": {
         "runtime": "nodejs18.x"
       }
     },
     "env": {
       "DATABASE_URL": "@database-url",
       "NEXTAUTH_SECRET": "@nextauth-secret",
       "REDIS_URL": "@redis-url"
     }
   }
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### AWS Deployment

#### Using AWS App Runner

1. **Create buildspec.yml**
   ```yaml
   version: 0.1
   runtime: nodejs18
   build:
     commands:
       build:
         - npm ci
         - npm run build
   run:
     runtime-version: 18
     command: npm start
     network:
       port: 3000
       env: PORT
   ```

2. **Deploy via AWS Console**
   - Create App Runner service
   - Connect to GitHub repository
   - Configure environment variables
   - Deploy

#### Using ECS with Fargate

1. **Create task definition**
2. **Setup load balancer**
3. **Configure service**
4. **Deploy container**

### Google Cloud Platform

#### Using Cloud Run

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Deploy**
   ```bash
   gcloud run deploy amhsj-app \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

## Kubernetes Deployment

### Namespace and ConfigMap

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: amhsj

---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: amhsj-config
  namespace: amhsj
data:
  NODE_ENV: "production"
  DATABASE_URL: "postgresql://user:pass@postgres:5432/amhsj"
  REDIS_URL: "redis://redis:6379"
```

### Application Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: amhsj-app
  namespace: amhsj
spec:
  replicas: 3
  selector:
    matchLabels:
      app: amhsj-app
  template:
    metadata:
      labels:
        app: amhsj-app
    spec:
      containers:
      - name: app
        image: amhsj/app:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: amhsj-config
        - secretRef:
            name: amhsj-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: amhsj-app-service
  namespace: amhsj
spec:
  selector:
    app: amhsj-app
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP

---
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: amhsj-ingress
  namespace: amhsj
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: amhsj-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: amhsj-app-service
            port:
              number: 80
```

## Environment-Specific Configurations

### Development Environment

```env
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost:5432/amhsj_dev
REDIS_URL=redis://localhost:6379
ENABLE_DEBUG_MODE=true
LOG_LEVEL=debug
```

### Staging Environment

```env
NODE_ENV=staging
NEXTAUTH_URL=https://staging.your-domain.com
DATABASE_URL=postgresql://staging-db:5432/amhsj_staging
REDIS_URL=redis://staging-redis:6379
ENABLE_MONITORING=true
LOG_LEVEL=info
```

### Production Environment

```env
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
DATABASE_URL=postgresql://prod-db:5432/amhsj
REDIS_URL=redis://prod-redis:6379
ENABLE_MONITORING=true
ENABLE_ERROR_TRACKING=true
LOG_LEVEL=warn
```

## Post-Deployment Setup

### SSL Certificate Renewal

For Let's Encrypt certificates:
```bash
# Add to crontab
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Database backup
docker-compose exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# File backup
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz ./uploads

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

### Monitoring Setup

1. **Health Check Script**
   ```bash
   #!/bin/bash
   # health-check.sh
   
   HEALTH_URL="https://your-domain.com/api/health"
   RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
   
   if [ $RESPONSE != "200" ]; then
       echo "Health check failed: $RESPONSE"
       # Send alert
   fi
   ```

2. **Log Rotation**
   ```bash
   # /etc/logrotate.d/amhsj
   /var/log/amhsj/*.log {
       daily
       missingok
       rotate 30
       compress
       delaycompress
       notifempty
       create 644 app app
       postrotate
           systemctl reload nginx
       endscript
   }
   ```

## Security Checklist

- [ ] SSL/TLS certificates installed and configured
- [ ] Security headers configured in Nginx
- [ ] Database credentials secured
- [ ] API keys stored as environment variables
- [ ] Firewall configured (allow only necessary ports)
- [ ] SSH key-based authentication enabled
- [ ] Fail2ban configured for SSH protection
- [ ] Regular security updates scheduled
- [ ] Backup encryption enabled
- [ ] Access logs monitored

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose exec postgres pg_isready
   
   # Check connection string
   docker-compose exec app node -e "console.log(process.env.DATABASE_URL)"
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis status
   docker-compose exec redis redis-cli ping
   ```

3. **SSL Certificate Issues**
   ```bash
   # Check certificate validity
   openssl x509 -in ssl/cert.pem -text -noout
   
   # Test SSL configuration
   curl -I https://your-domain.com
   ```

4. **Performance Issues**
   ```bash
   # Check resource usage
   docker stats
   
   # Monitor application logs
   docker-compose logs -f app
   ```

### Performance Optimization

1. **Database Optimization**
   ```sql
   -- Create indexes for frequently queried columns
   CREATE INDEX CONCURRENTLY idx_articles_status ON articles(status);
   CREATE INDEX CONCURRENTLY idx_articles_category ON articles(category);
   CREATE INDEX CONCURRENTLY idx_articles_published_date ON articles(published_date);
   
   -- Analyze query performance
   EXPLAIN ANALYZE SELECT * FROM articles WHERE status = 'published';
   ```

2. **Redis Configuration**
   ```bash
   # Optimize Redis memory usage
   redis-cli config set maxmemory-policy allkeys-lru
   redis-cli config set maxmemory 512mb
   ```

3. **Application Optimization**
   ```javascript
   // Enable production optimizations in next.config.mjs
   module.exports = {
     swcMinify: true,
     images: {
       unoptimized: false,
       formats: ['image/webp', 'image/avif']
     },
     experimental: {
       optimizeCss: true
     }
   }
   ```

## Rollback Strategy

### Quick Rollback

```bash
# Using Docker tags
docker-compose pull app:previous-version
docker-compose up -d app

# Using git
git checkout previous-stable-tag
docker-compose build app
docker-compose up -d app
```

### Database Rollback

```bash
# Restore from backup
gunzip -c /backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
docker-compose exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB
```

This deployment guide provides comprehensive coverage of all deployment scenarios for the AMHSJ platform. Choose the deployment method that best fits your infrastructure requirements and technical expertise.
