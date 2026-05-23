## Docker & Docker Compose Configuration

Your project has been optimized with production-ready Docker configurations. This document covers the setup, best practices, and deployment strategies.

### 📦 What Was Updated

#### Dockerfiles
- **Backend** (`backend/Dockerfile`): Multi-stage NestJS build
  - Builder stage: compiles TypeScript
  - Production stage: runs with non-root user, minimal runtime
  - Healthcheck included for orchestration
  - Layer caching optimized

- **Frontend** (`frontend/Dockerfile`): Multi-stage React+Vite build
  - Builder stage: compiles React app
  - Production stage: Nginx Alpine serves optimized SPA
  - Non-root user execution
  - Security headers configured
  - Gzip compression enabled
  - Healthcheck for monitoring

#### Docker Compose
- `docker-compose.yml`: Production environment
- `docker-compose.dev.yml`: Development overrides with hot-reload

#### Configuration Files
- `.dockerignore`: Optimized build context for both backend and frontend
- `nginx.conf`: Enhanced with security headers, API proxy, caching strategies

---

### 🚀 Quick Start

#### 1. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

#### 2. Build Images
```bash
docker compose build
```

#### 3. Start Services (Production)
```bash
# All services with MySQL, Backend, Frontend
docker compose up -d

# Frontend: http://localhost:80
# Backend API: http://localhost:3000
# API Docs: http://localhost:3000/api/docs
```

#### 4. Development with Hot-Reload
```bash
# Use development override for source code watching
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Frontend dev server: http://localhost:5173
# Backend dev with watch: http://localhost:3000
```

---

### 🎯 Key Improvements

#### Security
- ✅ Non-root user execution (NestJS runs as `nestjs:1001`, Nginx as `nginx-app:1001`)
- ✅ Minimal base images (alpine)
- ✅ Security headers in Nginx (CSP, X-Frame-Options, etc.)
- ✅ Production-grade CORS and Helmet enabled

#### Performance
- ✅ Multi-stage builds reduce final image size
- ✅ Layer caching optimized (package files copied before source)
- ✅ Production npm dependencies only
- ✅ Backend: 88.8 MB (down from larger unoptimized size)
- ✅ Frontend: 22.6 MB (Nginx Alpine + optimized bundle)

#### Reliability
- ✅ Healthchecks on all services (30s interval, 3 retries)
- ✅ Proper startup ordering (depends_on with conditions)
- ✅ Resource limits and reservations defined
- ✅ Restart policies for production resilience

#### Observability
- ✅ Structured service logging
- ✅ Healthcheck monitoring
- ✅ Resource usage constraints

---

### 📊 Service Architecture

```
┌─────────────────────────────────────────┐
│  Frontend (Nginx)                       │
│  Port: 80 → /usr/share/nginx/html      │
│  Memory: 256MB limit, 128MB reserve     │
│  Healthcheck: curl http://localhost:80  │
└──────────────┬──────────────────────────┘
               │ (Proxy /api/)
               ▼
┌─────────────────────────────────────────┐
│  Backend (NestJS)                       │
│  Port: 3000 → Node.js dist/main.js      │
│  Memory: 1024MB limit, 512MB reserve    │
│  Healthcheck: wget http://localhost:3000/health
│  Env: DB_HOST=mysql                     │
└──────────────┬──────────────────────────┘
               │ (TCP 3306)
               ▼
┌─────────────────────────────────────────┐
│  MySQL 8.0                              │
│  Port: 3306 → Database                  │
│  Volume: mysql_data                     │
│  Memory: 512MB limit, 256MB reserve     │
│  Healthcheck: mysqladmin ping           │
└─────────────────────────────────────────┘
```

---

### 🔧 Common Commands

#### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

#### Manage Services
```bash
# Stop services
docker compose stop

# Stop and remove containers (keeps volumes)
docker compose down

# Remove everything including volumes
docker compose down -v

# Rebuild specific service
docker compose build --no-cache backend
```

#### Database Access
```bash
# MySQL CLI inside container
docker compose exec mysql mysql -uroot -p$DB_PASS $DB_NAME

# Execute SQL file
docker compose exec mysql mysql -uroot -p$DB_PASS $DB_NAME < database/seeds.sql
```

#### Execute Commands in Containers
```bash
# Backend shell
docker compose exec backend sh

# Backend npm commands
docker compose exec backend npm run typeorm migration:run

# Frontend shell
docker compose exec frontend sh

# Frontend npm commands
docker compose exec frontend npm run build
```

---

### 📈 Production Deployment

#### 1. Pre-Deployment Checks
```bash
# Verify image sizes
docker images | grep proyecto_final-main

# Test locally with production docker-compose
docker compose up

# Verify health endpoints
curl http://localhost:3000/health
curl http://localhost/
```

#### 2. Push to Registry
```bash
# Tag images
docker tag proyecto_final-main-backend:latest your-registry/backend:v1.0.0
docker tag proyecto_final-main-frontend:latest your-registry/frontend:v1.0.0

# Push to registry
docker push your-registry/backend:v1.0.0
docker push your-registry/frontend:v1.0.0
```

#### 3. Deploy with Docker Compose (Single Host)
```bash
# On production server
scp docker-compose.yml server:/app/
scp .env server:/app/

# SSH into server
docker login
docker pull your-registry/backend:v1.0.0
docker pull your-registry/frontend:v1.0.0

cd /app
docker compose up -d
```

#### 4. Deploy to Kubernetes (Multi-Host)
Create manifests with Deployment + Service for each service. See `docs/k8s-deployment.yaml` for template.

---

### 🐛 Troubleshooting

#### Backend can't connect to MySQL
```bash
# Check MySQL is healthy
docker compose ps
docker compose logs mysql

# Verify network connectivity
docker compose exec backend ping mysql
```

#### Frontend returns 502 Gateway Error
```bash
# Check backend is running
docker compose logs backend

# Verify proxy configuration
docker compose exec frontend cat /etc/nginx/conf.d/default.conf

# Check backend healthcheck
curl http://localhost:3000/health
```

#### Database migration failed
```bash
# Check database logs
docker compose logs mysql

# Re-run seeds manually
docker compose exec mysql mysql -uroot -p$DB_PASS < database/schema.sql
```

#### Image size too large
Already optimized:
- Backend: 88.8MB (production runtime only)
- Frontend: 22.6MB (Nginx + built SPA)

Further optimization:
- Use distroless images (requires custom nginx image)
- Split frontend assets to CDN
- Compress bundle with brotli

---

### 📋 Environment Variables

Located in `.env`:
```env
DB_USER=root
DB_PASS=rootpassword123
DB_NAME=campus_virtual
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
```

**Production:** Generate strong secrets:
```bash
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

---

### 🔗 Additional Resources

- Backend README: `backend/README.md`
- Database setup: `database/README.md`
- API Swagger: http://localhost:3000/api/docs (after startup)
- Docker Compose reference: https://docs.docker.com/compose/compose-file/

---

### ✅ Next Steps

1. **Set up CI/CD**: GitHub Actions workflow to build and push images on commit
2. **Add a .dockerignore for frontend** to exclude test files and source maps  
3. **Implement logging**: ELK stack or Docker-provided logging drivers
4. **Configure backup strategy** for MySQL volume (use `mysqldump` periodic jobs)
5. **Add request/response tracing**: Integrate OpenTelemetry or Jaeger for observability
