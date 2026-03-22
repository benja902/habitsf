'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/features/auth/actions/auth'

export interface TaskAssignment {
  id: string
  task_id: string
  name: string
  description: string | null
  icon: string | null
  points: number
  is_rotative: boolean
}

export interface DailyTask {
  id: string
  task_id: string
  date: string
  completed: boolean
  completed_at: string | null
  notes: string | null
  member_id: string
}

export interface TaskWithProgress extends TaskAssignment {
  today_task?: DailyTask
  completed: boolean
  assigned_member_id: string
  assigned_member_name: string
}

export interface RotativeScheduleItem {
  task_name: string
  task_id: string
  member_name: string
  member_id: string
  day_of_week: string
}

/**
 * Obtener tareas del miembro actual para hoy - OPTIMIZADO con member_id
 */
export async function getTodayTasks(memberId?: string): Promise<TaskWithProgress[]> {
  console.log('🟡 getTodayTasks: START')
  const startTime = performance.now()

  let finalMemberId = memberId
  let memberName = ''

  // Si no se pasa memberId, usar el método legacy (getCurrentMember)
  if (!finalMemberId) {
    const member = await getCurrentMember()
    if (!member) throw new Error('No authenticated member found')
    finalMemberId = member.id
    memberName = member.name
    console.log('🟡 Member fetched (legacy):', performance.now() - startTime, 'ms')
  } else {
    // OPTIMIZACIÓN: Skip validation - RLS de Supabase protege automáticamente
    // Solo obtener el name del member (RLS garantiza que solo devuelve si pertenece al user autenticado)
    const supabase = await createClient()
    const { data: memberData, error: memberError } = await supabase
      .from('family_members')
      .select('name')
      .eq('id', finalMemberId)
      .single()

    // Si RLS bloquea (member no pertenece al usuario), error será != null
    if (memberError || !memberData) {
      throw new Error('Member not found or unauthorized')
    }

    memberName = memberData.name

    console.log('🟢 Member name fetched (RLS-protected):', performance.now() - startTime, 'ms')
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Obtener el día de la semana en formato correcto
  const dayOfWeekMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const todayDayOfWeek = dayOfWeekMap[new Date().getDay()]

  console.log('🟡 Today is:', today, ' - Day of week:', todayDayOfWeek)

  // PASO 1: Obtener tareas rotativas para hoy del member actual
  const rotativeStart = performance.now()
  const { data: rotativeAssignments, error: rotativeError } = await supabase
    .from('rotative_schedules')
    .select(`
      task_id,
      tasks!inner (
        id,
        name,
        description,
        icon,
        points,
        is_rotative,
        is_active
      )
    `)
    .eq('member_id', finalMemberId)
    .eq('day_of_week', todayDayOfWeek)
    .eq('tasks.is_active', true)
  console.log('🟡 Rotative assignments query:', performance.now() - rotativeStart, 'ms')

  if (rotativeError) {
    console.error('Error fetching rotative assignments:', rotativeError)
    // Continuar sin tareas rotativas
  }

  // PASO 2: Obtener tareas fijas del member actual (si las hay)
  const fixedStart = performance.now()
  const { data: fixedTasks, error: fixedError } = await supabase
    .from('tasks')
    .select('*')
    .eq('fixed_member_id', finalMemberId)
    .eq('is_active', true)
    .eq('is_rotative', false)
  console.log('🟡 Fixed tasks query:', performance.now() - fixedStart, 'ms')

  if (fixedError) {
    console.error('Error fetching fixed tasks:', fixedError)
    // Continuar sin tareas fijas
  }

  // PASO 3: Combinar todas las tareas asignadas
  const allAssignedTasks: TaskWithProgress[] = []

  // Agregar tareas rotativas
  if (rotativeAssignments && rotativeAssignments.length > 0) {
    for (const assignment of rotativeAssignments as any[]) {
      const task = assignment.tasks
      allAssignedTasks.push({
        id: task.id,
        task_id: task.id,
        name: task.name,
        description: task.description,
        icon: task.icon,
        points: task.points,
        is_rotative: task.is_rotative,
        completed: false,
        assigned_member_id: finalMemberId,
        assigned_member_name: memberName
      })
    }
  }

  // Agregar tareas fijas
  if (fixedTasks && fixedTasks.length > 0) {
    for (const task of fixedTasks as any[]) {
      allAssignedTasks.push({
        id: task.id,
        task_id: task.id,
        name: task.name,
        description: task.description,
        icon: task.icon,
        points: task.points,
        is_rotative: task.is_rotative,
        completed: false,
        assigned_member_id: finalMemberId,
        assigned_member_name: memberName
      })
    }
  }

  if (allAssignedTasks.length === 0) {
    console.log('🟡 No tasks assigned for today')
    return []
  }

  // PASO 4: Obtener daily_tasks para hoy (logs de completado)
  const dailyTasksStart = performance.now()
  const { data: todayDailyTasks, error: dailyTasksError } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('member_id', finalMemberId)
    .eq('date', today)
    .in('task_id', allAssignedTasks.map(t => t.task_id))
  console.log('🟡 Daily tasks query:', performance.now() - dailyTasksStart, 'ms')

  if (dailyTasksError) {
    console.error('Error fetching daily tasks:', dailyTasksError)
    // Continuar sin logs
  }

  // PASO 5: Combinar asignaciones con logs de completado
  const combineStart = performance.now()
  const tasksWithProgress: TaskWithProgress[] = allAssignedTasks.map((task) => {
    const dailyTask = (todayDailyTasks as any[] | null)?.find(
      (dt: any) => dt.task_id === task.task_id
    )

    return {
      ...task,
      today_task: dailyTask || undefined,
      completed: dailyTask?.completed || false,
    }
  })
  console.log('🟡 Combine data:', performance.now() - combineStart, 'ms')

  const totalTime = performance.now() - startTime
  console.log('🟢 getTodayTasks: SUCCESS in', totalTime, 'ms', memberId ? '(optimized)' : '(legacy)')
  return tasksWithProgress
}

/**
 * Marcar una tarea como completada
 */
export async function markTaskComplete(
  taskId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  console.log('🔵 markTaskComplete: START')
  const startTime = performance.now()

  try {
    const member = await getCurrentMember()
    if (!member) throw new Error('No authenticated member found')
    console.log('🔵 Member fetched:', performance.now() - startTime, 'ms')

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // UPSERT: Insert if not exists, update if exists
    const upsertStart = performance.now()
    const { error } = await supabase
      .from('daily_tasks')
      .upsert({
        task_id: taskId,
        member_id: member.id,
        date: today,
        completed: true,
        completed_at: new Date().toISOString(),
        notes: notes || null,
      }, {
        onConflict: 'task_id,date'
      })
    console.log('🔵 Upsert query:', performance.now() - upsertStart, 'ms')

    if (error) throw error

    const totalTime = performance.now() - startTime
    console.log('🟢 markTaskComplete: SUCCESS in', totalTime, 'ms')
    return { success: true }
  } catch (error) {
    const totalTime = performance.now() - startTime
    console.error('🔴 markTaskComplete: ERROR after', totalTime, 'ms', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Marcar una tarea como NO completada (deshacer)
 */
export async function markTaskIncomplete(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  console.log('🔵 markTaskIncomplete: START')
  const startTime = performance.now()

  try {
    const member = await getCurrentMember()
    if (!member) throw new Error('No authenticated member found')

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // Actualizar o eliminar el daily_task
    const updateStart = performance.now()
    const { error } = await supabase
      .from('daily_tasks')
      .upsert({
        task_id: taskId,
        member_id: member.id,
        date: today,
        completed: false,
        completed_at: null,
        notes: null,
      }, {
        onConflict: 'task_id,date'
      })
    console.log('🔵 Update query:', performance.now() - updateStart, 'ms')

    if (error) throw error

    const totalTime = performance.now() - startTime
    console.log('🟢 markTaskIncomplete: SUCCESS in', totalTime, 'ms')
    return { success: true }
  } catch (error) {
    const totalTime = performance.now() - startTime
    console.error('🔴 markTaskIncomplete: ERROR after', totalTime, 'ms', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Obtener la rotación semanal completa
 */
export async function getWeeklySchedule(): Promise<{ [key: string]: RotativeScheduleItem[] }> {
  console.log('🟡 getWeeklySchedule: START')
  const startTime = performance.now()

  const supabase = await createClient()

  // Una sola query con JOIN para obtener toda la rotación
  const queryStart = performance.now()
  const { data: schedule, error } = await supabase
    .from('rotative_schedules')
    .select(`
      day_of_week,
      tasks!inner (
        id,
        name
      ),
      family_members!inner (
        id,
        name
      )
    `)
  console.log('🟡 Schedule query:', performance.now() - queryStart, 'ms')

  if (error) {
    console.error('Error fetching weekly schedule:', error)
    throw new Error('Failed to fetch weekly schedule')
  }

  // Organizar por día de la semana
  const organizeStart = performance.now()
  const scheduleByDay: { [key: string]: RotativeScheduleItem[] } = {}
  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  // Inicializar cada día
  daysOrder.forEach(day => {
    scheduleByDay[day] = []
  })

  // Llenar con datos
  if (schedule && schedule.length > 0) {
    for (const item of schedule as any[]) {
      scheduleByDay[item.day_of_week].push({
        task_name: item.tasks.name,
        task_id: item.tasks.id,
        member_name: item.family_members.name,
        member_id: item.family_members.id,
        day_of_week: item.day_of_week,
      })
    }
  }

  // Ordenar las tareas dentro de cada día alfabéticamente
  daysOrder.forEach(day => {
    scheduleByDay[day].sort((a, b) => a.task_name.localeCompare(b.task_name))
  })

  console.log('🟡 Organize data:', performance.now() - organizeStart, 'ms')

  const totalTime = performance.now() - startTime
  console.log('🟢 getWeeklySchedule: SUCCESS in', totalTime, 'ms')
  return scheduleByDay
}