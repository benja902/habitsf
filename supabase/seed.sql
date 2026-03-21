-- HabitsF Seed Data
-- Execute this AFTER schema.sql in your Supabase SQL Editor
-- IMPORTANT: Replace the user_id values with actual auth.users IDs after creating users

-- Family Members (user_id will be null until users are created in Auth)
INSERT INTO family_members (name, nickname, role) VALUES
  ('Pablo', 'Pablo', 'member'),
  ('Benjamin', 'Benja', 'member'),
  ('David', 'David', 'member'),
  ('Maricielo', 'Mari', 'member'),
  ('Mama', 'Mama', 'admin'),
  ('Walter', 'Papa Walter', 'admin');

-- Get member IDs for reference
DO $$
DECLARE
  pablo_id UUID;
  benja_id UUID;
  david_id UUID;
  mari_id UUID;
  mama_id UUID;
  papa_id UUID;
BEGIN
  SELECT id INTO pablo_id FROM family_members WHERE name = 'Pablo';
  SELECT id INTO benja_id FROM family_members WHERE name = 'Benjamin';
  SELECT id INTO david_id FROM family_members WHERE name = 'David';
  SELECT id INTO mari_id FROM family_members WHERE name = 'Maricielo';
  SELECT id INTO mama_id FROM family_members WHERE name = 'Mama';
  SELECT id INTO papa_id FROM family_members WHERE name = 'Walter';

  -- Habits (assigned to all children by default)
  INSERT INTO habits (name, description, icon, frequency, points) VALUES
    ('Tender la cama', 'Tender la cama al levantarse', 'bed', 'daily', 5),
    ('Cepillarse los dientes (manana)', 'Cepillado de dientes por la manana', 'smile', 'daily', 5),
    ('Cepillarse los dientes (noche)', 'Cepillado de dientes antes de dormir', 'smile', 'daily', 5),
    ('Banarse', 'Bano diario', 'shower-head', 'daily', 5),
    ('Ordenar cuarto', 'Mantener el cuarto ordenado', 'home', 'daily', 10),
    ('Hacer tareas escolares', 'Completar tareas de la escuela', 'book', 'daily', 15),
    ('Leer 15 minutos', 'Lectura diaria', 'book-open', 'daily', 10),
    ('Orar', 'Oracion diaria', 'heart', 'daily', 5);

  -- Assign habits to children
  INSERT INTO habit_assignments (habit_id, member_id)
  SELECT h.id, m.id
  FROM habits h
  CROSS JOIN family_members m
  WHERE m.role = 'member';

  -- Tasks (rotative and fixed)
  INSERT INTO tasks (name, description, icon, is_rotative, points) VALUES
    ('Lavar platos', 'Lavar los platos despues de comer', 'utensils', TRUE, 15),
    ('Barrer', 'Barrer la casa', 'wind', TRUE, 10),
    ('Trapear', 'Trapear los pisos', 'droplet', TRUE, 15),
    ('Sacar basura', 'Sacar la basura', 'trash-2', TRUE, 10),
    ('Limpiar bano', 'Limpiar el bano', 'bath', TRUE, 20);

  -- Rotative schedules (example: rotating weekly among children)
  -- Monday
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, pablo_id, 'monday' FROM tasks t WHERE t.name = 'Lavar platos';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, benja_id, 'monday' FROM tasks t WHERE t.name = 'Barrer';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, david_id, 'monday' FROM tasks t WHERE t.name = 'Trapear';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, mari_id, 'monday' FROM tasks t WHERE t.name = 'Sacar basura';

  -- Tuesday
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, benja_id, 'tuesday' FROM tasks t WHERE t.name = 'Lavar platos';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, david_id, 'tuesday' FROM tasks t WHERE t.name = 'Barrer';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, mari_id, 'tuesday' FROM tasks t WHERE t.name = 'Trapear';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, pablo_id, 'tuesday' FROM tasks t WHERE t.name = 'Sacar basura';

  -- Wednesday
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, david_id, 'wednesday' FROM tasks t WHERE t.name = 'Lavar platos';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, mari_id, 'wednesday' FROM tasks t WHERE t.name = 'Barrer';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, pablo_id, 'wednesday' FROM tasks t WHERE t.name = 'Trapear';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, benja_id, 'wednesday' FROM tasks t WHERE t.name = 'Sacar basura';

  -- Thursday
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, mari_id, 'thursday' FROM tasks t WHERE t.name = 'Lavar platos';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, pablo_id, 'thursday' FROM tasks t WHERE t.name = 'Barrer';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, benja_id, 'thursday' FROM tasks t WHERE t.name = 'Trapear';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, david_id, 'thursday' FROM tasks t WHERE t.name = 'Sacar basura';

  -- Friday
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, pablo_id, 'friday' FROM tasks t WHERE t.name = 'Lavar platos';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, benja_id, 'friday' FROM tasks t WHERE t.name = 'Barrer';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, david_id, 'friday' FROM tasks t WHERE t.name = 'Trapear';
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, mari_id, 'friday' FROM tasks t WHERE t.name = 'Sacar basura';

  -- Saturday (all help with bathroom)
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, pablo_id, 'saturday' FROM tasks t WHERE t.name = 'Limpiar bano';

  -- Sunday (rest day - minimal tasks)
  INSERT INTO rotative_schedules (task_id, member_id, day_of_week)
  SELECT t.id, benja_id, 'sunday' FROM tasks t WHERE t.name = 'Limpiar bano';

  -- Rules
  INSERT INTO rules (title, description, category) VALUES
    ('Respeto a los padres', 'Hablar con respeto a mama y papa', 'Respeto'),
    ('Respeto entre hermanos', 'Tratar a los hermanos con respeto', 'Respeto'),
    ('Hora de dormir', 'Acostarse a la hora establecida', 'Horarios'),
    ('Uso de dispositivos', 'Uso limitado de celular/tablet/TV', 'Tecnologia'),
    ('Tareas escolares', 'Completar todas las tareas antes de jugar', 'Responsabilidad'),
    ('Honestidad', 'Siempre decir la verdad', 'Valores'),
    ('Orden y limpieza', 'Mantener espacios personales ordenados', 'Responsabilidad'),
    ('Puntualidad', 'Llegar a tiempo a actividades', 'Horarios'),
    ('Alimentacion', 'Comer lo que se sirve sin quejas', 'Salud'),
    ('Lenguaje apropiado', 'No usar malas palabras', 'Respeto'),
    ('Peleas fisicas', 'Prohibido pelearse con los hermanos', 'Respeto'),
    ('Obediencia', 'Obedecer instrucciones de los padres', 'Respeto'),
    ('Higiene personal', 'Mantener higiene diaria', 'Salud'),
    ('Pertenencias ajenas', 'No tomar cosas sin permiso', 'Respeto'),
    ('Gritos y berrinches', 'Comunicarse sin gritar', 'Respeto'),
    ('Compartir', 'Compartir con los hermanos', 'Valores'),
    ('Gratitud', 'Dar gracias por lo que se recibe', 'Valores');

END $$;
