# AMHSJ Production Deployment Guide

## 🚀 Complete Production Setup

This guide covers the complete production deployment of the AMHSJ Academic Journal platform.

## Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **Database**: PostgreSQL 14+
- **Cache**: Redis 6+
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 50GB minimum, SSD recommended
- **SSL**: Valid SSL certificate

### Required Accounts & API Keys
- **Database**: PostgreSQL production instance
- **Email**: Resend + Zoho Mail (already configured)
- **ORCID**: OAuth2 application credentials
- **CrossRef**: DOI registration account
- **Plagiarism**: Turnitin/Copyscape API access
- **Monitoring**: Sentry account
- **Analytics**: Google Analytics 4
- **Storage**: ImageKit account
- **CDN**: Optional (Cloudflare recommended)

## 🔧 Production Configuration

### 1. Environment Setup

Run the production setup script for your platform:

#### Windows:
```powershell
.\scripts\setup-production.ps1 -Domain "amhsj.org"
```

#### Linux/macOS:
```bash
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

### 2. Environment Variables

Update `.env.production` with your production values:

```env
# Core Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://amhsj.org
NEXTAUTH_URL=https://amhsj.org
NEXTAUTH_SECRET=your-super-secure-secret-here

# Database (Production)
DATABASE_URL=postgresql://prod_user:prod_password@prod-db-host:5432/amhsj_prod

# Redis (Production)
UPSTASH_REDIS_REST_URL=https://your-prod-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-prod-redis-token

# Email (Already configured hybrid service)
RESEND_API_KEY=your-resend-api-key
ZOHO_MAIL_USER=journal@amhsj.org
ZOHO_MAIL_PASS=your-zoho-app-password

# External APIs
ORCID_CLIENT_ID=your-orcid-client-id
ORCID_CLIENT_SECRET=your-orcid-client-secret
CROSSREF_USERNAME=your-crossref-username
CROSSREF_PASSWORD=your-crossref-password
TURNITIN_API_KEY=your-turnitin-api-key
COPYSCAPE_USERNAME=your-copyscape-username
COPYSCAPE_API_KEY=your-copyscape-api-key

# Monitoring & Analytics
SENTRY_DSN=your-sentry-dsn
GOOGLE_ANALYTICS_ID=your-ga4-measurement-id
MONITORING_SECRET_KEY=your-monitoring-secret

# Storage
IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-endpoint

# Security
ENCRYPTION_KEY=your-32-char-encryption-key
RATE_LIMIT_SECRET=your-rate-limit-secret
```

### 3. Database Migration

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed production data
npm run db:seed:prod
```

### 4. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d amhsj.org -d www.amhsj.org

# Update paths in .env.production
SSL_CERT_PATH=/etc/letsencrypt/live/amhsj.org/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/amhsj.org/privkey.pem
```

#### Option B: Commercial SSL
- Purchase SSL certificate from a trusted CA
- Install certificate files
- Update SSL paths in configuration

## 🐳 Deployment Options

### Option 1: Docker Deployment (Recommended)

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale application
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

### Option 2: PM2 Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### Option 3: Windows Service

```powershell
# Install node-windows
npm install -g node-windows

# Run service installer (as Administrator)
node install-service.js
```

### Option 4: IIS Deployment (Windows)

1. Install IIS with Node.js support
2. Install iisnode module
3. Configure IIS site with `web.config`
4. Deploy application files

## 🔍 Monitoring & Maintenance

### Health Monitoring

The application includes comprehensive monitoring:

- **Health Checks**: `/api/monitoring/health`
- **Performance Metrics**: Real-time analytics
- **Error Tracking**: Sentry integration
- **Uptime Monitoring**: Automated alerts

### Background Workers

Start the background worker for maintenance tasks:

```bash
# With PM2
pm2 start scripts/worker.js --name amhsj-worker

# Standalone
node scripts/worker.js
```

Background tasks include:
- Email queue processing
- Database cleanup
- Report generation
- Health checks
- Log rotation

### Backup Strategy

#### Automated Backups

```bash
# Run backup script
./scripts/backup.sh

# Or on Windows
.\scripts\backup.ps1
```

#### Backup Schedule
- **Database**: Daily at 2 AM
- **Files**: Daily at 3 AM
- **Configuration**: Weekly
- **Retention**: 30 days

### Log Management

Logs are organized in `./logs/`:
- `app/`: Application logs
- `access/`: Access logs
- `error/`: Error logs
- `security/`: Security events
- `reports/`: Daily reports
- `health/`: Health check data

## 🔒 Security Hardening

### Application Security
- CSRF protection enabled
- Rate limiting configured
- Security headers set
- Input validation enforced
- SQL injection prevention
- XSS protection

### Infrastructure Security
- SSL/TLS encryption
- Database encryption at rest
- Secure session management
- Environment variable protection
- Regular security updates

### Access Control
- Role-based permissions
- Multi-factor authentication
- Audit logging
- Session timeout
- Password policies

## 📊 Performance Optimization

### Application Performance
- Next.js optimizations enabled
- Image optimization (ImageKit)
- Database query optimization
- Redis caching strategy
- CDN integration ready

### Infrastructure Performance
- Load balancing (with multiple instances)
- Database connection pooling
- Redis connection optimization
- Nginx proxy caching
- Static asset optimization

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT version();"

# Check connection pool
npm run db:status
```

#### Redis Connection Issues
```bash
# Test Redis connection
redis-cli -u $UPSTASH_REDIS_REST_URL ping
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /path/to/cert.pem -text -noout

# Verify certificate chain
openssl verify -CAfile /path/to/ca-bundle.pem /path/to/cert.pem
```

#### Performance Issues
```bash
# Check application metrics
curl https://amhsj.org/api/monitoring/health

# View PM2 status
pm2 status

# Check system resources
htop
```

### Log Analysis

```bash
# View application logs
tail -f logs/app/combined.log

# Search for errors
grep -i error logs/app/*.log

# Analyze access patterns
tail -f logs/access/access.log | grep -E "(POST|PUT|DELETE)"
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Session store sharing (Redis)
- Database read replicas
- CDN for static assets

### Vertical Scaling
- Memory optimization
- CPU optimization
- Database tuning
- Cache optimization

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm run test
      
      - name: Deploy to production
        run: |
          # Your deployment script here
          ssh user@amhsj.org "cd /var/www/amhsj && git pull && npm install && npm run build && pm2 reload all"
```

## 📋 Production Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] SSL certificate installed and verified
- [ ] Database migrations completed
- [ ] External API credentials tested
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Security hardening applied

### Post-Deployment
- [ ] Health checks passing
- [ ] All API endpoints responding
- [ ] Email delivery working
- [ ] File uploads functioning
- [ ] User authentication working
- [ ] Search functionality active
- [ ] Analytics tracking enabled
- [ ] Backup verification completed

### Ongoing Maintenance
- [ ] Monitor application health
- [ ] Review security logs
- [ ] Update dependencies regularly
- [ ] Backup verification
- [ ] Performance monitoring
- [ ] User feedback monitoring

## 🆘 Support & Maintenance

### Emergency Contacts
- **System Administrator**: admin@amhsj.org
- **Database Administrator**: dba@amhsj.org
- **Security Officer**: security@amhsj.org

### Maintenance Windows
- **Regular Maintenance**: Sundays 2-4 AM UTC
- **Emergency Maintenance**: As needed with 2-hour notice
- **Security Updates**: Immediate deployment

### Documentation Updates
- Keep deployment documentation current
- Update API documentation
- Maintain runbooks for common tasks
- Document any custom configurations

---

## 🎉 Deployment Complete!

Your AMHSJ Academic Journal platform is now production-ready with:

✅ **External API Integrations**: Real DOI, ORCID, plagiarism detection  
✅ **Production Monitoring**: Comprehensive health checks and analytics  
✅ **Security Hardening**: Enterprise-grade security measures  
✅ **Scalable Architecture**: Ready for growth and high availability  
✅ **Automated Maintenance**: Background workers and scheduled tasks  

The platform is now 100% production-ready! 🚀
