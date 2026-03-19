# Frontend - Campus Virtual UDEC

Aplicación React + Vite para el sistema de recorrido virtual.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará en: `http://localhost:5173`

## 🏗️ Estructura

```
src/
├── components/        # Componentes reutilizables
│   └── Unity3DPlaceholder.tsx  # 🎮 Placeholder para Unity 3D
├── pages/            # Páginas de la app
│   ├── Login.tsx
│   ├── VirtualTour.tsx
│   ├── admin/        # Panel administrador
│   └── subadmin/     # Panel subadmin
├── services/         # Clientes API
│   ├── api.ts
│   ├── authService.ts
│   └── unity3dService.ts  # Comunicación con 3D
├── store/            # Estado global (Zustand)
│   └── authStore.ts
├── App.tsx           # Componente principal + routing
├── main.tsx          # Entry point
└── index.css         # Estilos globales
```

## 🎨 Diseño

### Colores Institucionales
- **Primario**: #003366 (Azul UDEC)
- **Secundario**: #2D8659 (Verde)
- **Acento**: #FFB71B (Dorado)

### Tipografía
- **Interfaz**: Inter
- **Títulos**: Roboto Slab

### Características Visuales
- Glassmorphism en cards
- Animaciones CSS suaves
- Diseño responsive (mobile-first)
- Gradientes modernos

## 🔐 Rutas

### Públicas
- `/` - Recorrido virtual
- `/login` - Iniciar sesión

### Protegidas (Requieren auth)
- `/admin/*` - Panel administrador (solo ADMIN)
- `/subadmin/*` - Panel subadmin (solo SUBADMIN)

## 🎮 Integración Unity 3D

El componente `Unity3DPlaceholder` está preparado para:

- ✅ Cargar datos desde `/api/3d/*`
- ✅ Comunicación bidireccional con Unity
- ✅ Eventos `window.postMessage`
- ✅ Documentación integrada

**Para integrar Unity WebGL:**
1. Builds de Unity en `/public/unity-build/`
2. Actualizar `Unity3DPlaceholder.tsx`
3. Conectar eventos bidireccionales
4. Ver `docs/3D_INTEGRATION_GUIDE.md`

## 📡 API Services

### authService
```typescript
authService.login({ email, password })
authService.getProfile()
authService.logout()
```

### unity3dService
```typescript
unity3dService.getPoints()
unity3dService.getAreas()
unity3dService.getWorldData()
unity3dService.sendToUnity(message)
```

## 🛠️ Scripts

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run preview      # Preview build
npm run lint         # ESLint
npm run lint:fix     # Fix automático
```

## 📱 Responsive Design

- **Desktop**: 1280px+
- **Tablet**: 768px - 1279px
- **Mobile**: < 768px

Todos los componentes son completamente responsive.

## 🔧 Configuración

### Vite Proxy
El desarrollo usa proxy para evitar CORS:
```typescript
'/api' -> 'http://localhost:3000'
```

### Variables de Entorno
```env
VITE_API_URL=http://localhost:3000/api
```

## 📦 Build

```bash
npm run build
```

Genera archivos optimizados en `/dist`:
- Minificación
- Tree shaking
- Code splitting
- Asset optimization

## 🎯 Features

✅ Autenticación JWT con storage
✅ Rutas protegidas por rol
✅ Estado global con Zustand
✅ API client con interceptors
✅ Componentes responsive
✅ Placeholder 3D funcional
✅ Diseño moderno y profesional
✅ Optimizado para producción
