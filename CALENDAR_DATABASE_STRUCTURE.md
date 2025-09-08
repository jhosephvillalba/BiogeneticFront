# Estructura de Base de Datos para Calendario de Actividades

## Tabla: calendar_tasks

Esta tabla almacenará todas las tareas del calendario con la siguiente estructura:

### Campos de la tabla:

```sql
CREATE TABLE calendar_tasks (
    id SERIAL PRIMARY KEY,
    task_suffix VARCHAR(100) NOT NULL,           -- Ej: pedro_perez_task_1
    client_name VARCHAR(255) NOT NULL,           -- Nombre del cliente sin sufijo
    client_id INTEGER REFERENCES users(id),      -- ID del cliente
    task_name VARCHAR(100) NOT NULL,             -- Opus, FIV, CIV, D3, D5, Previsión, Informe
    task_type VARCHAR(50) NOT NULL,              -- opus, fiv, civ, d3, d5, prevision, informe
    task_date DATE NOT NULL,                     -- Fecha de la tarea
    veterinarian VARCHAR(255) NOT NULL,          -- Nombre del veterinario
    location VARCHAR(500) NOT NULL,              -- Lugar donde se realizará el proceso
    status VARCHAR(20) DEFAULT 'pending',        -- pending, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),     -- Usuario que creó la tarea
    notes TEXT,                                  -- Notas adicionales
    priority VARCHAR(20) DEFAULT 'normal'        -- low, normal, high, urgent
);
```

### Índices recomendados:

```sql
-- Índices para optimizar consultas
CREATE INDEX idx_calendar_tasks_date ON calendar_tasks(task_date);
CREATE INDEX idx_calendar_tasks_client ON calendar_tasks(client_id);
CREATE INDEX idx_calendar_tasks_status ON calendar_tasks(status);
CREATE INDEX idx_calendar_tasks_suffix ON calendar_tasks(task_suffix);
CREATE INDEX idx_calendar_tasks_type ON calendar_tasks(task_type);
CREATE INDEX idx_calendar_tasks_date_range ON calendar_tasks(task_date, status);
```

## Tabla: calendar_task_templates

Esta tabla almacenará las plantillas de tareas semanales para generar automáticamente:

```sql
CREATE TABLE calendar_task_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,         -- Nombre de la plantilla
    day_offset INTEGER NOT NULL,                 -- Días desde el inicio (0-7)
    task_name VARCHAR(100) NOT NULL,             -- Nombre de la tarea
    task_type VARCHAR(50) NOT NULL,              -- Tipo de tarea
    description TEXT,                            -- Descripción de la tarea
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Datos iniciales para plantillas:

```sql
INSERT INTO calendar_task_templates (template_name, day_offset, task_name, task_type, description) VALUES
('Semana Estándar', 0, 'Opus', 'opus', 'Procedimiento OPUS'),
('Semana Estándar', 1, 'FIV', 'fiv', 'Fertilización In Vitro'),
('Semana Estándar', 2, 'CIV', 'civ', 'Cultivo In Vitro'),
('Semana Estándar', 3, 'CIV', 'civ', 'Cultivo In Vitro'),
('Semana Estándar', 4, 'D3', 'd3', 'Evaluación Día 3'),
('Semana Estándar', 5, 'D5', 'd5', 'Evaluación Día 5'),
('Semana Estándar', 6, 'Previsión', 'prevision', 'Previsión de resultados'),
('Semana Estándar', 7, 'Informe', 'informe', 'Generación de informe final');
```

## Tabla: calendar_settings

Configuraciones del calendario:

```sql
CREATE TABLE calendar_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Configuraciones iniciales:

```sql
INSERT INTO calendar_settings (setting_key, setting_value, description) VALUES
('default_veterinarian', '', 'Veterinario por defecto'),
('default_location', '', 'Ubicación por defecto'),
('auto_generate_weekly', 'true', 'Generar tareas semanales automáticamente'),
('task_prefix_format', '{client_name}_task_{number}', 'Formato del prefijo de tareas'),
('max_tasks_per_day', '10', 'Máximo número de tareas por día'),
('reminder_days_before', '1', 'Días antes para recordatorios');
```

## Funciones de Base de Datos

### Función para generar sufijo único:

```sql
CREATE OR REPLACE FUNCTION generate_task_suffix(client_name VARCHAR, client_id INTEGER)
RETURNS VARCHAR AS $$
DECLARE
    task_count INTEGER;
    suffix VARCHAR;
BEGIN
    -- Contar tareas existentes para este cliente
    SELECT COUNT(*) INTO task_count 
    FROM calendar_tasks 
    WHERE client_id = $2;
    
    -- Generar sufijo
    suffix := LOWER(REPLACE(client_name, ' ', '_')) || '_task_' || (task_count + 1);
    
    RETURN suffix;
END;
$$ LANGUAGE plpgsql;
```

### Función para crear tareas semanales:

```sql
CREATE OR REPLACE FUNCTION create_weekly_tasks(
    p_client_name VARCHAR,
    p_client_id INTEGER,
    p_start_date DATE,
    p_veterinarian VARCHAR,
    p_location VARCHAR,
    p_created_by INTEGER
)
RETURNS VOID AS $$
DECLARE
    template_record RECORD;
    task_suffix VARCHAR;
    task_date DATE;
BEGIN
    -- Generar sufijo único
    task_suffix := generate_task_suffix(p_client_name, p_client_id);
    
    -- Crear tareas para cada día de la semana
    FOR template_record IN 
        SELECT * FROM calendar_task_templates 
        WHERE is_active = true 
        ORDER BY day_offset
    LOOP
        task_date := p_start_date + template_record.day_offset;
        
        INSERT INTO calendar_tasks (
            task_suffix,
            client_name,
            client_id,
            task_name,
            task_type,
            task_date,
            veterinarian,
            location,
            created_by
        ) VALUES (
            task_suffix,
            p_client_name,
            p_client_id,
            template_record.task_name,
            template_record.task_type,
            task_date,
            p_veterinarian,
            p_location,
            p_created_by
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Vistas Útiles

### Vista para tareas del día:

```sql
CREATE VIEW daily_tasks AS
SELECT 
    ct.*,
    u.full_name as client_full_name,
    u.email as client_email,
    u.phone as client_phone
FROM calendar_tasks ct
LEFT JOIN users u ON ct.client_id = u.id
WHERE ct.task_date = CURRENT_DATE
ORDER BY ct.task_date, ct.task_name;
```

### Vista para estadísticas:

```sql
CREATE VIEW calendar_stats AS
SELECT 
    task_date,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tasks
FROM calendar_tasks
GROUP BY task_date
ORDER BY task_date;
```

## Triggers

### Trigger para actualizar updated_at:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_tasks_updated_at
    BEFORE UPDATE ON calendar_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Consultas de Ejemplo

### Obtener tareas de un cliente específico:

```sql
SELECT * FROM calendar_tasks 
WHERE client_id = 123 
ORDER BY task_date, day_offset;
```

### Obtener tareas pendientes para hoy:

```sql
SELECT * FROM calendar_tasks 
WHERE task_date = CURRENT_DATE 
AND status = 'pending'
ORDER BY task_name;
```

### Obtener estadísticas del mes:

```sql
SELECT 
    DATE_TRUNC('month', task_date) as month,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM calendar_tasks 
WHERE task_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', task_date);
```

## Consideraciones de Seguridad

1. **Permisos**: Solo usuarios con rol 'admin' pueden crear/editar tareas
2. **Validación**: Verificar que las fechas sean futuras al crear tareas
3. **Auditoría**: Mantener registro de quién creó/modificó cada tarea
4. **Integridad**: Verificar que el cliente existe antes de crear tareas

## Migración de Datos

Si ya existe una tabla de tareas, se puede migrar con:

```sql
-- Ejemplo de migración desde tabla existente
INSERT INTO calendar_tasks (
    task_suffix,
    client_name,
    client_id,
    task_name,
    task_type,
    task_date,
    veterinarian,
    location,
    status,
    created_at
)
SELECT 
    CONCAT(LOWER(REPLACE(client_name, ' ', '_')), '_task_', ROW_NUMBER() OVER (PARTITION BY client_name ORDER BY created_at)),
    client_name,
    client_id,
    task_name,
    task_type,
    task_date,
    veterinarian,
    location,
    status,
    created_at
FROM existing_tasks_table;
``` 