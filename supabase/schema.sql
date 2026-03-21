-- HabitsF Database Schema
-- Execute this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE family_role AS ENUM ('admin', 'member');
CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'specific_days');
CREATE TYPE consequence_status AS ENUM ('pending', 'in_progress', 'completed', 'forgiven');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Family Members table
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  nickname VARCHAR(50),
  avatar_url TEXT,
  role family_role DEFAULT 'member',
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habits table
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  frequency habit_frequency DEFAULT 'daily',
  specific_days day_of_week[],
  points INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habit Assignments (which members have which habits)
CREATE TABLE habit_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, member_id)
);

-- Habit Logs (daily tracking)
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES family_members(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, member_id, date)
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  is_rotative BOOLEAN DEFAULT FALSE,
  fixed_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  points INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rotative Schedules (who does what on which day)
CREATE TABLE rotative_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, day_of_week)
);

-- Daily Tasks (generated daily instances)
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES family_members(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, date)
);

-- Rules table
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consequences table
CREATE TABLE consequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES rules(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status consequence_status DEFAULT 'pending',
  assigned_by UUID REFERENCES family_members(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  forgiven_at TIMESTAMP WITH TIME ZONE,
  forgiven_by UUID REFERENCES family_members(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_habit_logs_member_date ON habit_logs(member_id, date);
CREATE INDEX idx_habit_logs_date ON habit_logs(date);
CREATE INDEX idx_daily_tasks_member_date ON daily_tasks(member_id, date);
CREATE INDEX idx_daily_tasks_date ON daily_tasks(date);
CREATE INDEX idx_consequences_member_status ON consequences(member_id, status);
CREATE INDEX idx_rotative_schedules_day ON rotative_schedules(day_of_week);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at
  BEFORE UPDATE ON rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consequences_updated_at
  BEFORE UPDATE ON consequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotative_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE consequences ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow authenticated users to access family data)
-- Since this is a single-family app, all authenticated users can see all data

CREATE POLICY "Authenticated users can view family_members"
  ON family_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view habits"
  ON habits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view habit_assignments"
  ON habit_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view habit_logs"
  ON habit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert habit_logs"
  ON habit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update habit_logs"
  ON habit_logs FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view rotative_schedules"
  ON rotative_schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view daily_tasks"
  ON daily_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert daily_tasks"
  ON daily_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update daily_tasks"
  ON daily_tasks FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view rules"
  ON rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view consequences"
  ON consequences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert consequences"
  ON consequences FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update consequences"
  ON consequences FOR UPDATE
  TO authenticated
  USING (true);

-- Admin-only policies for management
CREATE POLICY "Admins can manage family_members"
  ON family_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage habits"
  ON habits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage rules"
  ON rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'admin'
    )
  );
