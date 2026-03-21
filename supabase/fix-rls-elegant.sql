-- SOLUCIÓN B CORREGIDA: Política más elegante sin recursión
-- Usa el user_id directamente en lugar de consultar family_members

-- 1. Crear función helper para verificar roles
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fm.role::text
  FROM family_members fm
  WHERE fm.user_id = auth.uid()
  LIMIT 1;
$$;

-- 2. Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Admins can manage family_members" ON family_members;
DROP POLICY IF EXISTS "Admins can manage habits" ON habits;
DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage rules" ON rules;

-- 3. Políticas separadas para cada operación

-- Family Members - Solo admins pueden gestionar
CREATE POLICY "Admin family_members select"
  ON family_members FOR SELECT
  TO authenticated
  USING (auth.user_role() = 'admin'::text);

CREATE POLICY "Admin family_members insert"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.user_role() = 'admin'::text);

CREATE POLICY "Admin family_members update"
  ON family_members FOR UPDATE
  TO authenticated
  USING (auth.user_role() = 'admin'::text)
  WITH CHECK (auth.user_role() = 'admin'::text);

CREATE POLICY "Admin family_members delete"
  ON family_members FOR DELETE
  TO authenticated
  USING (auth.user_role() = 'admin'::text);

-- Habits - Solo admins pueden gestionar
CREATE POLICY "Admin habits insert"
  ON habits FOR INSERT
  TO authenticated
  WITH CHECK (auth.user_role() = 'admin'::text);

CREATE POLICY "Admin habits update"
  ON habits FOR UPDATE
  TO authenticated
  USING (auth.user_role() = 'admin'::text);

CREATE POLICY "Admin habits delete"
  ON habits FOR DELETE
  TO authenticated
  USING (auth.user_role() = 'admin'::text);

-- Tasks - Solo admins pueden gestionar
CREATE POLICY "Admin tasks insert"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.user_role() = 'admin'::text);

CREATE POLICY "Admin tasks update"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.user_role() = 'admin'::text);

CREATE POLICY "Admin tasks delete"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.user_role() = 'admin'::text);

-- Rules - Solo admins pueden gestionar
CREATE POLICY "Admin rules insert"
  ON rules FOR INSERT
  TO authenticated
  WITH CHECK (auth.user_role() = 'admin'::text);

CREATE POLICY "Admin rules update"
  ON rules FOR UPDATE
  TO authenticated
  USING (auth.user_role() = 'admin'::text);

CREATE POLICY "Admin rules delete"
  ON rules FOR DELETE
  TO authenticated
  USING (auth.user_role() = 'admin'::text);