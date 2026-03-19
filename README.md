# Sistema de Recorrido Virtual Campus UDEC

Sistema web completo para recorrido virtual 3D interactivo del Campus Universidad de Cundinamarca - Extensión Facatativá.

## 🎯 Descripción

Aplicación full-stack con:
- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: NestJS + TypeScript
- **Base de Datos**: MySQL 8.0+
- **Autenticación**: JWT + Roles (USER, ADMIN, SUBADMIN)
- **Integración 3D**: Preparado para Unity WebGL (placeholder incluido)

## 🚀 Inicio Rápido

### Opción 1: Docker (Recomendado)

```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 2. Iniciar todos los servicios
docker-compose up -d

# La aplicación estará disponible en:
# Frontend: http://localhost
# Backend API: http://localhost:3000
# Swagger Docs: http://localhost:3000/api/docs
```

### Opción 2: MySQL Workbench (Recomendado para Windows) ⭐

**Requisitos:**
- Node.js 18+
- MySQL 8.0+ con MySQL Workbench
- PowerShell

**Paso 1: Configurar Base de Datos**
1. Abrir MySQL Workbench
2. Conectarse a tu servidor MySQL
3. Abrir el archivo `database/setup-complete.sql`
4. Ejecutar todo el script (Ctrl+Shift+Enter)

**Paso 2: Iniciar Servidores**
```powershell
# Iniciar backend y frontend
.\scripts\start-dev-windows.ps1

# La aplicación estará disponible en:
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# Swagger Docs: http://localhost:3000/api/docs
```

Ver guía completa: [MYSQL_WORKBENCH_SETUP.md](docs/MYSQL_WORKBENCH_SETUP.md)

### Opción 3: Instalación Manual

**Requisitos:**
- Node.js 18+
- MySQL 8.0+
- npm o yarn

**Paso 1: Base de Datos**

**Linux/Mac:**
```bash
cd database
mysql -u root -p < schema.sql
mysql -u root -p campus_virtual < seeds.sql
```

**Windows PowerShell:**
```powershell
cd database
Get-Content schema.sql | mysql -u root -p
Get-Content seeds.sql | mysql -u root -p campus_virtual
```

**Paso 2: Backend**
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con credenciales de MySQL
npm run start:dev
```

**Paso 3: Frontend**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 📁 Estructura del Proyecto

```
campus-virtual-udec/
├── frontend/          # Aplicación React + Vite
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── services/      # API clients
│   │   ├── store/         # Zustand stores
│   │   └── App.tsx
│   └── package.json
│
├── backend/           # API NestJS
│   ├── src/
│   │   ├── auth/          # Autenticación JWT
│   │   ├── users/         # Gestión de usuarios
│   │   ├── areas/         # Áreas del campus
│   │   ├── points-of-interest/  # Puntos de interés
│   │   ├── events/        # Eventos
│   │   ├── news/          # Noticias
│   │   ├── statistics/    # Analytics
│   │   ├── unity3d/       # 🎮 Integración 3D
│   │   └── entities/      # Modelos TypeORM
│   └── package.json
│
├── database/          # Scripts SQL
│   ├── schema.sql     # Esquema completo
│   └── seeds.sql      # Datos iniciales
│
├── docs/              # Documentación
└── docker-compose.yml # Orquestación Docker
```

## 👥 Roles del Sistema

### 1. Usuario (USER)
- Acceso al recorrido virtual 3D
- Consulta de información pública

### 2. Administrador (ADMIN)
- Acceso completo al sistema
- Gestión de usuarios y subadministradores
- CRUD de todo el contenido
- Visualización de estadísticas
- Asignación de áreas a subadministradores

### 3. Subadministrador (SUBADMIN)
- CRUD de contenido solo en áreas asignadas
- Sin acceso a gestión de usuarios
- Permisos limitados por área

## 🔐 Credenciales de Prueba

**Administrador:**
- Email: `admin@udec.edu.co`
- Contraseña: `Admin123!`

⚠️ **IMPORTANTE**: Cambiar estas credenciales en producción

## 🎮 Integración Unity 3D

El sistema está **completamente preparado** para integrar el modelo 3D de Unity WebGL:

### Endpoints Disponibles

- `GET /api/3d/points` - Puntos de interés con coordenadas 3D
- `GET /api/3d/areas` - Áreas del campus con ubicaciones
- `GET /api/3d/world` - Datos completos del mundo 3D

### Placeholder Incluido

El componente `Unity3DPlaceholder` muestra:
- ✅ Conexión API en tiempo real
- ✅ Datos de puntos y áreas cargados
- ✅ Sistema de comunicación bidireccional preparado
- ✅ Instrucciones detalladas de integración

**Para integrar Unity:**
1. Generar build de Unity WebGL
2. Copiar archivos a `/frontend/public/unity-build/`
3. Reemplazar `Unity3DPlaceholder.tsx` con loader de Unity
4. Configurar eventos `window.postMessage`
5. Ver documentación completa en `docs/3D_INTEGRATION_GUIDE.md`

## 📊 Características

✅ **Backend Completo**
- API REST con Swagger
- Autenticación JWT + Roles
- 8 módulos funcionales
- Validación de datos
- Rate limiting
- Seguridad (Helmet, CORS, bcrypt)

✅ **Frontend Completo**
- React 18 con TypeScript
- Routing protegido por roles
- Panel Admin profesional
- Panel Subadmin con permisos
- Diseño moderno y responsive
- Sistema de estado con Zustand

✅ **Base de Datos**
- 9 tablas relacionales
- Índices optimizados
- Datos de prueba incluidos
- Vistas SQL para consultas

✅ **DevOps**
- Docker Compose completo
- Dockerfiles optimizados
- Nginx configurado
- Healthchecks

## 📚 Documentación

- **Backend API**: `backend/README.md`
- **Swagger Docs**: `http://localhost:3000/api/docs`
- **Base de Datos**: `database/README.md`
- **Setup MySQL Workbench**: `docs/MYSQL_WORKBENCH_SETUP.md` ⭐
- **Integración 3D**: `docs/3D_INTEGRATION_GUIDE.md`
- **Deploy**: `docs/DEPLOYMENT.md`

## 🛠️ Scripts Útiles

### Backend
```bash
npm run start:dev    # Desarrollo con watch
npm run build        # Compilar
npm run start:prod   # Producción
npm run test         # Tests
```

### Frontend
```bash
npm run dev          # Servidor desarrollo
npm run build        # Build producción
npm run preview      # Preview del build
```

## 🔒 Seguridad

- ✅ Contraseñas hasheadas (bcrypt)
- ✅ JWT con expiración
- ✅ CORS configurado
- ✅ Validación de inputs
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Rate limiting

## 📦 Deploy

Ver guía completa en `docs/DEPLOYMENT.md`

## 📄 Licencia

Universidad de Cundinamarca - Extensión Facatativá

---

**Desarrollado para**: Universidad de Cundinamarca  
**Tecnologías**: React, NestJS, MySQL, Unity WebGL (preparado)  
**Estado**: ✅ Sistema funcional - Listo para integración 3D
