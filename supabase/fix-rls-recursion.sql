-- TEMPORAL: Solución rápida para la recursión infinita de RLS
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Eliminar las políticas problemáticas de administradores
DROP POLICY IF EXISTS "Admins can manage family_members" ON family_members;
DROP POLICY IF EXISTS "Admins can manage habits" ON habits;
DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage rules" ON rules;

-- 2. Políticas más permisivas (TEMPORALES para desarrollo)
CREATE POLICY "All authenticated users can manage family_members"
  ON family_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can manage habits"
  ON habits FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can manage rules"
  ON rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Nota: Estas políticas son muy permisivas y solo para desarrollo.
-- En producción deberías implementar políticas más restrictivas.