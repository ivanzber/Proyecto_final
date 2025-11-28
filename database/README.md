# Base de Datos - Campus Virtual UDEC

Este directorio contiene los scripts SQL para la base de datos MySQL del sistema.

## Archivos

- **schema.sql** - Esquema completo de la base de datos (tablas, índices, vistas)
- **seeds.sql** - Datos iniciales para desarrollo y pruebas

## Configuración

### Requisitos
- MySQL 8.0 o superior
- Cliente MySQL o herramienta de administración (MySQL Workbench, phpMyAdmin, etc.)

### Instalación

1. **Crear la base de datos y esquema:**
```bash
mysql -u root -p < schema.sql
```

2. **Insertar datos iniciales:**
```bash
mysql -u root -p campus_virtual < seeds.sql
```

## Credenciales Iniciales

**Administrador por defecto:**
- Email: `admin@udec.edu.co`
- Contraseña: `Admin123!`

> ⚠️ **IMPORTANTE:** Cambiar esta contraseña antes de desplegar en producción

## Estructura de Tablas

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios autenticados del sistema |
| `roles` | Catálogo de roles (USER, ADMIN, SUBADMIN) |
| `areas` | Áreas del campus universitario |
| `subadmin_areas` | Asignación de subadmins a áreas |
| `points_of_interest` | Puntos de interés del recorrido 3D |
| `events` | Eventos institucionales |
| `news` | Noticias y anuncios |
| `statistics` | Métricas de uso y navegación |
| `audit_logs` | Registro de auditoría |

### Vistas

- `v_users_with_roles` - Usuarios con información de roles
- `v_points_with_area` - Puntos de interés con datos de área
- `v_statistics_summary` - Resumen de estadísticas por día

## Respaldos

### Crear respaldo
```bash
mysqldump -u root -p campus_virtual > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar respaldo
```bash
mysql -u root -p campus_virtual < backup_file.sql
```

## Migraciones

Para cambios en producción, crear archivos de migración numerados:
- `001_add_column_example.sql`
- `002_create_index_example.sql`

Ejecutar en orden secuencial para mantener consistencia.

## Notas Técnicas

- **Charset:** utf8mb4 para soporte completo de Unicode
- **Collation:** utf8mb4_unicode_ci para comparaciones correctas
- **Engine:** InnoDB para transacciones ACID
- **JSON Fields:** Para datos flexibles (coordinates, metadata, additional_info)
- **Timestamps:** AUTO_UPDATE en campos `updated_at`
