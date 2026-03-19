# Configuración de Base de Datos con MySQL Workbench

## 📋 Requisitos Previos

- MySQL Server 8.0+ instalado
- MySQL Workbench instalado
- Credenciales de acceso a MySQL (usuario root o con privilegios de creación de bases de datos)

## 🚀 Pasos para Configurar la Base de Datos

### Opción 1: Usando el Script Consolidado (Recomendado)

1. **Abrir MySQL Workbench**
   - Inicia MySQL Workbench
   - Conecta a tu servidor MySQL local

2. **Abrir el Script SQL**
   - Ve a `File > Open SQL Script...`
   - Navega a: `database/setup-complete.sql`
   - Haz clic en `Open`

3. **Ejecutar el Script**
   - Haz clic en el ícono del rayo ⚡ (Execute) o presiona `Ctrl+Shift+Enter`
   - El script ejecutará automáticamente:
     - Creación de la base de datos `campus_virtual`
     - Eliminación de tablas existentes (si las hay)
     - Creación de todas las tablas
     - Inserción de datos iniciales
     - Creación de vistas

4. **Verificar la Instalación**
   - En el panel izquierdo, actualiza la lista de esquemas (botón de refrescar)
   - Deberías ver la base de datos `campus_virtual`
   - Expande la base de datos para ver las tablas creadas

### Opción 2: Ejecutar Scripts por Separado

Si prefieres ejecutar los scripts individualmente:

1. **Ejecutar Schema**
   ```
   File > Open SQL Script > database/schema.sql
   Execute (⚡)
   ```

2. **Ejecutar Seeds**
   ```
   File > Open SQL Script > database/seeds.sql
   Execute (⚡)
   ```

## 🔐 Credenciales de Prueba

Después de ejecutar el script, tendrás un usuario administrador creado:

- **Email**: `admin@udec.edu.co`
- **Contraseña**: `Admin123!`

⚠️ **IMPORTANTE**: Cambia estas credenciales en producción.

## 📊 Estructura de la Base de Datos

La base de datos incluye las siguientes tablas:

### Tablas Principales
- `roles` - Roles del sistema (USER, ADMIN, SUBADMIN)
- `users` - Usuarios con autenticación
- `areas` - Áreas del campus
- `subadmin_areas` - Asignación de áreas a subadministradores
- `points_of_interest` - Puntos de interés en el recorrido 3D
- `events` - Eventos institucionales
- `news` - Noticias y anuncios
- `statistics` - Métricas de uso
- `audit_logs` - Registro de auditoría

### Vistas
- `v_users_with_roles` - Usuarios con información de rol
- `v_points_with_area` - Puntos de interés con área
- `v_statistics_summary` - Resumen de estadísticas

## 🔧 Configurar el Backend

Después de crear la base de datos, configura la conexión en el backend:

1. **Editar `backend/.env`**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASS=tu_contraseña_mysql
   DB_NAME=campus_virtual
   ```

2. **Iniciar el Backend**
   ```powershell
   cd backend
   npm run start:dev
   ```

## ✅ Verificación

Para verificar que todo está correcto:

1. **En MySQL Workbench**, ejecuta:
   ```sql
   USE campus_virtual;
   SELECT * FROM roles;
   SELECT * FROM users;
   SELECT * FROM areas;
   ```

2. **Deberías ver**:
   - 3 roles (USER, ADMIN, SUBADMIN)
   - 1 usuario administrador
   - 10 áreas del campus
   - 5 puntos de interés
   - 3 eventos
   - 3 noticias

## 🔄 Reiniciar la Base de Datos

Si necesitas reiniciar la base de datos desde cero:

1. Ejecuta nuevamente el script `setup-complete.sql`
2. El script automáticamente eliminará las tablas existentes y las recreará
3. Los datos de prueba se insertarán nuevamente

## 🛠️ Troubleshooting

### Error: "Access denied for user"
- Verifica que tu usuario MySQL tenga permisos para crear bases de datos
- Intenta conectarte como `root`

### Error: "Table already exists"
- El script `setup-complete.sql` incluye `DROP TABLE IF EXISTS`
- Si aún así falla, elimina manualmente la base de datos:
  ```sql
  DROP DATABASE IF EXISTS campus_virtual;
  ```
  Y ejecuta el script nuevamente

### Error: "Unknown database 'campus_virtual'"
- Asegúrate de que el script se ejecutó completamente
- Verifica que no hubo errores durante la ejecución

## 📝 Notas Adicionales

- El script usa `utf8mb4` para soportar emojis y caracteres especiales
- Las contraseñas están hasheadas con bcrypt (salt rounds = 10)
- Los datos JSON están en formato válido para MySQL 8.0+
- Las foreign keys garantizan la integridad referencial

---

**Siguiente paso**: Una vez configurada la base de datos, inicia el backend y frontend con:
```powershell
.\scripts\start-dev-windows.ps1
```
