-- Verificar índices existentes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE
    schemaname = 'public'
    AND tablename IN ('family_members', 'habit_assignments', 'habit_logs', 'rotative_schedules', 'daily_tasks', 'tasks')
ORDER BY tablename, indexname;

-- Crear índices críticos (SIN CONCURRENTLY para Supabase Dashboard)

-- Índices para hábitos
CREATE INDEX IF NOT EXISTS idx_family_members_user_id
    ON family_members(user_id);

CREATE INDEX IF NOT EXISTS idx_habit_assignments_member_id
    ON habit_assignments(member_id);

CREATE INDEX IF NOT EXISTS idx_habit_logs_member_date
    ON habit_logs(member_id, date);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date
    ON habit_logs(habit_id, date);

-- Índices para tareas
CREATE INDEX IF NOT EXISTS idx_rotative_schedules_member_day
    ON rotative_schedules(member_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_member_date
    ON daily_tasks(member_id, date);

CREATE INDEX IF NOT EXISTS idx_tasks_active_rotative
    ON tasks(is_active, is_rotative);

-- Verificar configuración de región
SELECT current_setting('TimeZone') as timezone;