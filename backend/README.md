# Backend API - Campus Virtual UDEC

API REST desarrollada con NestJS para el sistema de recorrido virtual del campus.

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+ 
- npm o yarn
- MySQL 8.0+

### Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus credenciales de MySQL
```

3. **Crear la base de datos:**
```bash
# Ejecutar scripts SQL
mysql -u root -p < ../database/schema.sql
mysql -u root -p campus_virtual < ../database/seeds.sql
```

4. **Iniciar el servidor:**
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

El servidor estará disponible en: `http://localhost:3000`

Documentación Swagger: `http://localhost:3000/api/docs`

## 📚 Documentación API

### Autenticación

**POST /api/auth/login**
```json
{
  "email": "admin@udec.edu.co",
  "password": "Admin123!"
}
```

Respuesta:
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@udec.edu.co",
    "firstName": "Admin",
    "lastName": "Principal",
    "role": "ADMIN"
  }
}
```

**GET /api/auth/profile**  
Requiere: Bearer Token  
Retorna: Perfil del usuario autenticado

### Endpoints Principales

| Módulo | Endpoint Base | Descripción |
|--------|---------------|-------------|
| Auth | `/api/auth` | Autenticación y perfil |
| Users | `/api/users` | Gestión de usuarios (ADMIN) |
| Areas | `/api/areas` | Áreas del campus |
| Points | `/api/points` | Puntos de interés |
| Events | `/api/events` | Eventos institucionales |
| News | `/api/news` | Noticias y anuncios |
| Statistics | `/api/statistics` | Métricas y analytics |
| 3D | `/api/3d` | **Integración Unity WebGL** |

### Endpoints de Integración 3D

**GET /api/3d/points**  
Obtiene todos los puntos de interés con coordenadas 3D

**GET /api/3d/areas**  
Obtiene todas las áreas con ubicaciones 3D

**GET /api/3d/world**  
Datos completos para inicializar el mundo 3D

## 🔐 Sistema de Roles

### USER
- Acceso público al recorrido virtual
- Consulta de información

### SUBADMIN
- CRUD de contenido en áreas asignadas
- No puede gestionar usuarios

### ADMIN
- Acceso completo al sistema
- Gestión de usuarios y subadministradores
- Asignación de áreas
- Visualización de estadísticas

## 🛠️ Estructura del Proyecto

```
src/
├── auth/              # Autenticación JWT
│   ├── decorators/    # @Roles, @GetUser
│   ├── guards/        # JwtAuthGuard, RolesGuard
│   └── strategies/    # JWT, Local strategies
├── entities/          # Entidades TypeORM
├── users/             # Gestión de usuarios
├── areas/             # Áreas del campus
├── points-of-interest/# Puntos de interés
├── events/            # Eventos
├── news/              # Noticias
├── statistics/        # Analytics
├── unity3d/           # 🎮 Integración 3D
├── app.module.ts      # Módulo principal
└── main.ts            # Entry point
```

## 🎮 Integración Unity 3D

El backend provee endpoints específicos para la comunicación con el modelo 3D:

### Flujo de Datos

1. **Unity carga**: Llama a `/api/3d/world` para obtener puntos y áreas
2. **Renderiza**: Coloca markers 3D en las coordenadas recibidas
3. **Interacción**: Cuando el usuario hace clic, registra estadística
4. **Sincronización**: Actualiza datos periódicamente

### Formato de Coordenadas

```json
{
  "x": 100,  // Posición en eje X
  "y": 0,    // Altura / eje Y
  "z": 50    // Posición en eje Z
}
```

Ver documentación completa en: `docs/3D_INTEGRATION_GUIDE.md`

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (salt rounds: 10)
- ✅ JWT con expiración configurable
- ✅ CORS configurado
- ✅ Helmet.js para headers de seguridad
- ✅ Validación y sanitización con class-validator
- ✅ Rate limiting
- ✅ TypeORM con consultas parametrizadas (SQL injection prevention)

## 📊 Scripts Disponibles

```bash
npm run start          # Iniciar servidor
npm run start:dev      # Modo desarrollo con watch
npm run start:prod     # Producción
npm run build          # Compilar TypeScript
npm run test           # Tests unitarios
npm run test:e2e       # Tests de integración
npm run lint           # ESLint
```

## 🐛 Debugging

Logs se muestran en consola durante desarrollo.

Para debugging avanzado:
```bash
npm run start:debug
```

## 📦 Deploy

Ver `docs/DEPLOYMENT.md` para instrucciones de despliegue.

##Licencia

Universidad de Cundinamarca - Extensión Facatativá
