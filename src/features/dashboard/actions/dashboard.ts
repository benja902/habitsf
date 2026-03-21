'use server'

import { createClient } from '@/lib/supabase/server'
import type { FamilyMember, Habit, Task, Consequence } from '@/types/database'

/**
 * Obtener el family_member del usuario autenticado
 */
export async function getCurrentMember(): Promise<FamilyMember | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: member } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return member
}

/**
 * Obtener resumen de hábitos del día
 */
export async function getTodayHabitsStats(memberId: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Obtener todos los hábitos asignados al miembro
  const { data: assignments } = await supabase
    .from('habit_assignments')
    .select(`
      id,
      habit_id,
      habits (
        id,
        name,
        frequency,
        specific_days,
        is_active
      )
    `)
    .eq('member_id', memberId)

  if (!assignments || assignments.length === 0) {
    return { total: 0, completed: 0, pending: 0 }
  }

  // Filtrar hábitos que aplican hoy
  const todayDayOfWeek = new Date()
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase()

  const habitsForToday = (assignments as any[]).filter((assignment: any) => {
    const habit = assignment.habits
    if (!habit || !habit.is_active) return false

    if (habit.frequency === 'daily') return true
    if (habit.frequency === 'specific_days' && habit.specific_days) {
      return habit.specific_days.includes(todayDayOfWeek)
    }
    return false
  })

  // Obtener logs del día
  const { data: logs } = await supabase
    .from('habit_logs')
    .select('habit_id, completed')
    .eq('member_id', memberId)
    .eq('date', today)

  const completed = (logs as any[] | null)?.filter((log: any) => log.completed).length || 0

  return {
    total: habitsForToday.length,
    completed,
    pending: habitsForToday.length - completed,
  }
}

/**
 * Obtener tareas del día
 */
export async function getTodayTasks(memberId: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const todayDayOfWeek = new Date()
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase()

  // Tareas rotativas del día
  const { data: rotativeTasks } = await supabase
    .from('rotative_schedules')
    .select(`
      task_id,
      tasks (
        id,
        name,
        description,
        icon,
        is_active
      )
    `)
    .eq('member_id', memberId)
    .eq('day_of_week', todayDayOfWeek)

  // Tareas fijas del miembro
  const { data: fixedTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('fixed_member_id', memberId)
    .eq('is_active', true)

  const allTasks: Task[] = [
    ...((rotativeTasks as any[] | null)?.map((rt: any) => rt.tasks).filter(Boolean) || []),
    ...(fixedTasks || []),
  ]

  // Verificar cuáles están completadas
  const { data: dailyTaskLogs } = await supabase
    .from('daily_tasks')
    .select('task_id, completed')
    .eq('member_id', memberId)
    .eq('date', today)

  const completedTaskIds = new Set(
    (dailyTaskLogs as any[] | null)
      ?.filter((dt: any) => dt.completed)
      .map((dt: any) => dt.task_id) || []
  )

  const tasksWithStatus = allTasks.map((task) => ({
    ...task,
    completed: completedTaskIds.has(task.id),
  }))

  return {
    total: allTasks.length,
    completed: tasksWithStatus.filter((t) => t.completed).length,
    tasks: tasksWithStatus,
  }
}

/**
 * Obtener consecuencias activas
 */
export async function getActiveConsequences(memberId: string) {
  const supabase = await createClient()

  const { data: consequences } = await supabase
    .from('consequences')
    .select(`
      *,
      rules (
        id,
        title,
        category
      )
    `)
    .eq('member_id', memberId)
    .in('status', ['pending', 'in_progress'])
    .order('assigned_at', { ascending: false })

  return consequences || []
}

/**
 * Obtener estadísticas de puntos del miembro
 */
export async function getMemberPoints(memberId: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const weekStart = startOfWeek.toISOString().split('T')[0]

  // Puntos de hábitos completados hoy
  const { data: todayHabitLogs } = await supabase
    .from('habit_logs')
    .select(`
      habit_id,
      habits (points)
    `)
    .eq('member_id', memberId)
    .eq('date', today)
    .eq('completed', true)

  const todayHabitPoints =
    (todayHabitLogs as any[] | null)?.reduce((sum: number, log: any) => {
      const habit = log.habits
      return sum + (habit?.points || 0)
    }, 0) || 0

  // Puntos de tareas completadas hoy
  const { data: todayTaskLogs } = await supabase
    .from('daily_tasks')
    .select(`
      task_id,
      tasks (points)
    `)
    .eq('member_id', memberId)
    .eq('date', today)
    .eq('completed', true)

  const todayTaskPoints =
    (todayTaskLogs as any[] | null)?.reduce((sum: number, log: any) => {
      const task = log.tasks
      return sum + (task?.points || 0)
    }, 0) || 0

  // Puntos de la semana
  const { data: weekHabitLogs } = await supabase
    .from('habit_logs')
    .select(`
      habit_id,
      habits (points)
    `)
    .eq('member_id', memberId)
    .gte('date', weekStart)
    .eq('completed', true)

  const weekHabitPoints =
    (weekHabitLogs as any[] | null)?.reduce((sum: number, log: any) => {
      const habit = log.habits
      return sum + (habit?.points || 0)
    }, 0) || 0

  const { data: weekTaskLogs } = await supabase
    .from('daily_tasks')
    .select(`
      task_id,
      tasks (points)
    `)
    .eq('member_id', memberId)
    .gte('date', weekStart)
    .eq('completed', true)

  const weekTaskPoints =
    (weekTaskLogs as any[] | null)?.reduce((sum: number, log: any) => {
      const task = log.tasks
      return sum + (task?.points || 0)
    }, 0) || 0

  return {
    today: todayHabitPoints + todayTaskPoints,
    week: weekHabitPoints + weekTaskPoints,
  }
}

/**
 * Obtener resumen completo para el dashboard
 */
export async function getDashboardData() {
  const member = await getCurrentMember()

  if (!member) {
    return null
  }

  const [habitsStats, tasksData, consequences, points] = await Promise.all([
    getTodayHabitsStats(member.id),
    getTodayTasks(member.id),
    getActiveConsequences(member.id),
    getMemberPoints(member.id),
  ])

  return {
    member,
    habits: habitsStats,
    tasks: tasksData,
    consequences,
    points,
  }
}
