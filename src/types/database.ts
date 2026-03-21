export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type FamilyRole = 'admin' | 'member'
export type HabitFrequency = 'daily' | 'weekly' | 'specific_days'
export type ConsequenceStatus = 'pending' | 'in_progress' | 'completed' | 'forgiven'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface Database {
  public: {
    Tables: {
      family_members: {
        Row: {
          id: string
          user_id: string | null
          name: string
          nickname: string | null
          avatar_url: string | null
          role: FamilyRole
          birth_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          nickname?: string | null
          avatar_url?: string | null
          role?: FamilyRole
          birth_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          nickname?: string | null
          avatar_url?: string | null
          role?: FamilyRole
          birth_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          frequency: HabitFrequency
          specific_days: DayOfWeek[] | null
          points: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          frequency?: HabitFrequency
          specific_days?: DayOfWeek[] | null
          points?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          frequency?: HabitFrequency
          specific_days?: DayOfWeek[] | null
          points?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      habit_assignments: {
        Row: {
          id: string
          habit_id: string
          member_id: string
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          member_id: string
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          member_id?: string
          created_at?: string
        }
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          member_id: string
          date: string
          completed: boolean
          completed_at: string | null
          verified_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          member_id: string
          date: string
          completed?: boolean
          completed_at?: string | null
          verified_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          member_id?: string
          date?: string
          completed?: boolean
          completed_at?: string | null
          verified_by?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          is_rotative: boolean
          fixed_member_id: string | null
          points: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          is_rotative?: boolean
          fixed_member_id?: string | null
          points?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          is_rotative?: boolean
          fixed_member_id?: string | null
          points?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      rotative_schedules: {
        Row: {
          id: string
          task_id: string
          member_id: string
          day_of_week: DayOfWeek
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          member_id: string
          day_of_week: DayOfWeek
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          member_id?: string
          day_of_week?: DayOfWeek
          created_at?: string
        }
      }
      daily_tasks: {
        Row: {
          id: string
          task_id: string
          member_id: string
          date: string
          completed: boolean
          completed_at: string | null
          verified_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          member_id: string
          date: string
          completed?: boolean
          completed_at?: string | null
          verified_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          member_id?: string
          date?: string
          completed?: boolean
          completed_at?: string | null
          verified_by?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      rules: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      consequences: {
        Row: {
          id: string
          member_id: string
          rule_id: string | null
          title: string
          description: string | null
          status: ConsequenceStatus
          assigned_by: string | null
          assigned_at: string
          due_date: string | null
          completed_at: string | null
          forgiven_at: string | null
          forgiven_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          rule_id?: string | null
          title: string
          description?: string | null
          status?: ConsequenceStatus
          assigned_by?: string | null
          assigned_at?: string
          due_date?: string | null
          completed_at?: string | null
          forgiven_at?: string | null
          forgiven_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          rule_id?: string | null
          title?: string
          description?: string | null
          status?: ConsequenceStatus
          assigned_by?: string | null
          assigned_at?: string
          due_date?: string | null
          completed_at?: string | null
          forgiven_at?: string | null
          forgiven_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      family_role: FamilyRole
      habit_frequency: HabitFrequency
      consequence_status: ConsequenceStatus
      day_of_week: DayOfWeek
    }
  }
}

// Helper types
export type FamilyMember = Database['public']['Tables']['family_members']['Row']
export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitAssignment = Database['public']['Tables']['habit_assignments']['Row']
export type HabitLog = Database['public']['Tables']['habit_logs']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type RotativeSchedule = Database['public']['Tables']['rotative_schedules']['Row']
export type DailyTask = Database['public']['Tables']['daily_tasks']['Row']
export type Rule = Database['public']['Tables']['rules']['Row']
export type Consequence = Database['public']['Tables']['consequences']['Row']

// Extended types with relations
export type HabitWithAssignments = Habit & {
  habit_assignments: (HabitAssignment & { family_members: FamilyMember })[]
}

export type TaskWithSchedule = Task & {
  rotative_schedules: (RotativeSchedule & { family_members: FamilyMember })[]
}

export type ConsequenceWithRelations = Consequence & {
  family_members: FamilyMember
  rules: Rule | null
  assigned_by_member: FamilyMember | null
}
