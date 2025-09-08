# Calendario de Actividades - Biogenetic Front

## Descripción

El Calendario de Actividades es una herramienta integral para gestionar y programar tareas relacionadas con procesos de reproducción asistida en ganado. Permite crear automáticamente una secuencia completa de tareas semanales para cada cliente.

## Características Principales

### 🗓️ Vista de Calendario
- **Vista mensual**: Visualización completa del mes con navegación
- **Días interactivos**: Click en cualquier día para crear nuevas tareas
- **Indicadores visuales**: Colores diferentes para tareas pendientes, completadas y canceladas
- **Hoy destacado**: El día actual se resalta automáticamente

### 📊 Estadísticas en Tiempo Real
- **Total de tareas**: Número total de tareas en el sistema
- **Tareas pendientes**: Tareas que aún no se han completado
- **Tareas completadas**: Tareas finalizadas exitosamente
- **Tareas de hoy**: Tareas programadas para el día actual

### 🔄 Generación Automática de Tareas
Al crear una nueva tarea, el sistema automáticamente genera una secuencia completa de 8 días:

1. **Día 1 - Opus**: Procedimiento OPUS
2. **Día 2 - FIV**: Fertilización In Vitro
3. **Día 3 - CIV**: Cultivo In Vitro
4. **Día 4 - CIV**: Cultivo In Vitro (continuación)
5. **Día 5 - D3**: Evaluación Día 3
6. **Día 6 - D5**: Evaluación Día 5
7. **Día 7 - Previsión**: Previsión de resultados
8. **Día 8 - Informe**: Generación de informe final

### 🏷️ Sistema de Identificación Único
- **Sufijo automático**: Cada cliente recibe un identificador único (ej: `pedro_perez_task_1`)
- **Trazabilidad**: Permite rastrear todas las tareas de un cliente específico
- **Sin conflictos**: Garantiza que no haya duplicados en la identificación

## Cómo Usar el Calendario

### 1. Crear Nueva Tarea
1. Click en el botón **"Nueva Tarea"** o en cualquier día del calendario
2. Seleccionar el **cliente** de la lista desplegable
3. Establecer la **fecha de inicio** (lunes recomendado)
4. Ingresar el **nombre del veterinario** responsable
5. Especificar la **ubicación** donde se realizará el proceso
6. Click en **"Crear Tareas"**

### 2. Gestionar Tareas Existentes
- **Ver detalles**: Click en cualquier tarea para ver información completa
- **Cambiar estado**: Click en el ícono de check/deshacer para marcar como completada/pendiente
- **Eliminar tarea**: Click en el ícono de basura para eliminar

### 3. Navegar por el Calendario
- **Mes anterior/siguiente**: Usar las flechas de navegación
- **Vista actual**: El mes y año se muestran en el centro
- **Días de otros meses**: Se muestran en gris para contexto

## Estructura de Datos

### Campos de Tarea
```javascript
{
  id: "pedro_perez_task_1_1",
  taskSuffix: "pedro_perez_task_1",
  clientName: "Pedro Pérez",
  clientId: 123,
  taskName: "Opus",
  taskType: "opus",
  date: "2024-01-15",
  veterinarian: "Dr. Juan García",
  location: "Laboratorio Central",
  status: "pending", // pending, completed, cancelled
  notes: "Notas adicionales",
  priority: "normal" // low, normal, high, urgent
}
```

### Estados de Tarea
- **🟡 Pendiente**: Tarea programada pero no iniciada
- **🟢 Completada**: Tarea finalizada exitosamente
- **🔴 Cancelada**: Tarea cancelada por algún motivo

## Funcionalidades Avanzadas

### Modal de Detalles
Al hacer click en una tarea se abre un modal con:
- **Información general**: Tarea, cliente, fecha, estado
- **Detalles del proceso**: Veterinario, ubicación, tipo de tarea
- **Identificador único**: Sufijo de la tarea para trazabilidad
- **Notas adicionales**: Información complementaria
- **Acciones**: Cambiar estado o cerrar

### Filtros y Búsqueda
- **Por fecha**: Ver tareas de un día específico
- **Por cliente**: Filtrar tareas de un cliente particular
- **Por estado**: Ver solo tareas pendientes, completadas o canceladas
- **Por tipo**: Filtrar por tipo de tarea (Opus, FIV, CIV, etc.)

### Responsive Design
- **Desktop**: Vista completa con todas las funcionalidades
- **Tablet**: Adaptación automática del layout
- **Mobile**: Interfaz optimizada para pantallas pequeñas

## Integración con el Sistema

### API Endpoints
- `GET /calendar/tasks` - Obtener todas las tareas
- `POST /calendar/tasks/weekly` - Crear tareas semanales
- `PATCH /calendar/tasks/{id}/toggle-status` - Cambiar estado
- `DELETE /calendar/tasks/{id}` - Eliminar tarea
- `GET /calendar/stats` - Obtener estadísticas

### Base de Datos
- **Tabla principal**: `calendar_tasks`
- **Plantillas**: `calendar_task_templates`
- **Configuraciones**: `calendar_settings`
- **Índices optimizados** para consultas rápidas

## Consideraciones Técnicas

### Rendimiento
- **Carga lazy**: Las tareas se cargan solo cuando es necesario
- **Paginación**: Soporte para grandes volúmenes de datos
- **Caché**: Estadísticas calculadas en tiempo real

### Seguridad
- **Autenticación**: Solo usuarios autorizados pueden acceder
- **Autorización**: Roles específicos para diferentes acciones
- **Validación**: Verificación de datos antes de procesar

### Escalabilidad
- **Arquitectura modular**: Fácil extensión de funcionalidades
- **API RESTful**: Interfaz estándar para integraciones
- **Base de datos optimizada**: Consultas eficientes

## Próximas Funcionalidades

### Planificadas
- [ ] **Notificaciones**: Recordatorios por email/SMS
- [ ] **Reportes**: Exportar datos a PDF/Excel
- [ ] **Calendario compartido**: Múltiples veterinarios
- [ ] **Plantillas personalizadas**: Diferentes secuencias de tareas
- [ ] **Integración con otros módulos**: Conectar con inventario, reportes

### Mejoras de UX
- [ ] **Drag & Drop**: Mover tareas entre fechas
- [ ] **Vista semanal**: Alternativa a la vista mensual
- [ ] **Búsqueda avanzada**: Filtros múltiples
- [ ] **Temas personalizables**: Diferentes esquemas de colores

## Soporte y Mantenimiento

### Logs y Monitoreo
- **Errores**: Captura automática de errores
- **Métricas**: Tiempo de respuesta, uso de recursos
- **Auditoría**: Registro de todas las acciones

### Backup y Recuperación
- **Backup automático**: Base de datos respaldada diariamente
- **Recuperación**: Procedimientos para restaurar datos
- **Integridad**: Verificación de consistencia de datos

## Contacto y Soporte

Para reportar problemas o solicitar nuevas funcionalidades:
- **Email**: soporte@biogenetic.com
- **Documentación**: [Wiki del proyecto]
- **Issues**: [Sistema de tickets]

---

*Desarrollado para Biogenetic - Sistema de Gestión de Reproducción Asistida* 