-- HabitsF - Migration: Add columns for habits module
-- Execute this AFTER running the main schema.sql

-- 1. Add missing columns to habits table
ALTER TABLE habits
ADD COLUMN category VARCHAR(50),
ADD COLUMN unit VARCHAR(50);

-- 2. Add target_value to habit_assignments
ALTER TABLE habit_assignments
ADD COLUMN target_value INTEGER DEFAULT 1;

-- 3. Add value to habit_logs (for tracking progress)
ALTER TABLE habit_logs
ADD COLUMN value INTEGER DEFAULT 0;

-- 4. Create indexes for performance
CREATE INDEX idx_habits_category ON habits(category);
CREATE INDEX idx_habit_logs_value ON habit_logs(value);

-- 5. Set default values for existing data (if any)
UPDATE habits SET
  category = 'general',
  unit = 'veces'
WHERE category IS NULL;

UPDATE habit_assignments SET
  target_value = 1
WHERE target_value IS NULL;

-- 6. Make columns NOT NULL after setting defaults
ALTER TABLE habits
  ALTER COLUMN category SET NOT NULL,
  ALTER COLUMN unit SET NOT NULL;

ALTER TABLE habit_assignments
  ALTER COLUMN target_value SET NOT NULL;