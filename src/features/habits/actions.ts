'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/features/auth/actions/auth'
import type { Database } from '@/types/database'

// OPCIÓN A: Comentado temporalmente para testear el over-fetching
// import { revalidatePath } from 'next/cache'

export interface HabitAssignment {
  id: string
  habit_id: string
  target_value: number
  habits: {
    id: string
    name: string
    category: string
    unit: string
    icon: string
    description: string | null
    frequency: 'daily' | 'specific_days'
    specific_days?: string[]
    is_active: boolean
    points: number
  }
}

export interface HabitLog {
  id: string
  habit_id: string
  member_id: string
  date: string
  value: number
  completed: boolean
  notes?: string
  created_at: string
}

export interface HabitWithProgress extends HabitAssignment {
  today_log?: HabitLog
  progress: number // 0-100
  completed: boolean
}

/**
 * Obtener hábitos del miembro actual para hoy - OPTIMIZADO con member_id
 */
export async function getTodayHabits(memberId?: string): Promise<HabitWithProgress[]> {
  console.log('🟡 getTodayHabits: START')
  const startTime = performance.now()

  let finalMemberId = memberId

  // Si no se pasa memberId, usar el método legacy (getCurrentMember)
  if (!finalMemberId) {
    const member = await getCurrentMember()
    if (!member) throw new Error('No authenticated member found')
    finalMemberId = member.id
    console.log('🟡 Member fetched (legacy):', performance.now() - startTime, 'ms')
  } else {
    // OPTIMIZACIÓN: Skip validation - RLS de Supabase protege automáticamente
    // memberId viene de useCurrentMember() autenticado, y todas las queries
    // subsecuentes están protegidas por RLS (auth.uid() = family_members.user_id)
    console.log('🟢 Member ID received from authenticated context:', performance.now() - startTime, 'ms')
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // PASO 1: Obtener asignaciones con hábitos (igual que antes)
  const assignmentsStart = performance.now()
  const { data: assignments, error: assignmentsError } = await supabase
    .from('habit_assignments')
    .select(`
      id,
      habit_id,
      target_value,
      habits (
        id,
        name,
        category,
        unit,
        icon,
        description,
        frequency,
        specific_days,
        is_active,
        points
      )
    `)
    .eq('member_id', finalMemberId)
  console.log('🟡 Assignments query:', performance.now() - assignmentsStart, 'ms')

  if (assignmentsError) {
    console.error('Error fetching habit assignments:', assignmentsError)
    throw new Error('Failed to fetch habit assignments')
  }

  if (!assignments || assignments.length === 0) {
    return []
  }

  // PASO 2: Filtrar hábitos activos que aplican hoy
  const filterStart = performance.now()
  const todayDayOfWeek = new Date()
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase()

  const todayAssignments = (assignments as any[]).filter((assignment: any) => {
    const habit = assignment.habits
    if (!habit || !habit.is_active) return false

    if (habit.frequency === 'daily') return true
    if (habit.frequency === 'specific_days' && habit.specific_days) {
      return habit.specific_days.includes(todayDayOfWeek)
    }
    return false
  })
  console.log('🟡 Filter habits:', performance.now() - filterStart, 'ms')

  // PASO 3: UNA query para TODOS los logs de hoy (NO por habit_id individual)
  const logsStart = performance.now()
  const { data: todayLogs, error: logsError } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('member_id', finalMemberId)
    .eq('date', today)
    .in('habit_id', todayAssignments.map((a: any) => a.habit_id))
  console.log('🟡 All logs query:', performance.now() - logsStart, 'ms')

  if (logsError) {
    console.error('Error fetching logs:', logsError)
    // No throwear, seguir sin logs
  }

  // PASO 4: Combinar asignaciones con logs
  const combineStart = performance.now()
  const habitsWithProgress: HabitWithProgress[] = todayAssignments.map((assignment: any) => {
    const todayLog = (todayLogs as any[] | null)?.find(
      (log: any) => log.habit_id === assignment.habit_id
    )

    const currentValue = todayLog?.value || 0
    const targetValue = assignment.target_value
    const progress = Math.min((currentValue / targetValue) * 100, 100)
    const completed = currentValue >= targetValue

    return {
      ...assignment,
      today_log: todayLog || undefined,
      progress,
      completed,
    }
  })
  console.log('🟡 Combine data:', performance.now() - combineStart, 'ms')

  const totalTime = performance.now() - startTime
  console.log('🟢 getTodayHabits: SUCCESS in', totalTime, 'ms', memberId ? '(optimized)' : '(legacy)')
  return habitsWithProgress
}

/**
 * Registrar progreso en un hábito
 */
export async function logHabitProgress(
  habitId: string,
  value: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  console.log('🔵 logHabitProgress: START')
  const startTime = performance.now()

  try {
    const member = await getCurrentMember()
    if (!member) throw new Error('No authenticated member found')
    console.log('🔵 Member fetched:', performance.now() - startTime, 'ms')

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // Verificar si ya existe un log para hoy
    const logCheckStart = performance.now()
    const { data: existingLog } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('member_id', member.id)
      .eq('habit_id', habitId)
      .eq('date', today)
      .single()
    console.log('🔵 Log check query:', performance.now() - logCheckStart, 'ms')

    // Obtener el target_value de la asignación
    const assignmentStart = performance.now()
    const { data: assignment }: { data: { target_value: number } | null } = await supabase
      .from('habit_assignments')
      .select('target_value')
      .eq('member_id', member.id)
      .eq('habit_id', habitId)
      .single()
    console.log('🔵 Assignment query:', performance.now() - assignmentStart, 'ms')

    if (!assignment) {
      throw new Error('Habit assignment not found')
    }

    const completed = value >= assignment!.target_value

    const upsertStart = performance.now()
    if (existingLog) {
      // Actualizar log existente
      const { error } = await supabase
        .from('habit_logs')
        .update({
          value,
          completed,
          notes: notes || existingLog.notes,
        })
        .eq('id', existingLog.id)

      if (error) throw error
    } else {
      // Crear nuevo log
      const { error } = await supabase
        .from('habit_logs')
        .insert({
          member_id: member.id,
          habit_id: habitId,
          date: today,
          value,
          completed,
          notes,
        })

      if (error) throw error
    }
    console.log('🔵 Upsert query:', performance.now() - upsertStart, 'ms')

    const totalTime = performance.now() - startTime
    console.log('🟢 logHabitProgress: SUCCESS in', totalTime, 'ms')

    // OPCIÓN A: Comentado temporalmente para testear si esto causa el over-fetching
    // revalidatePath('/dashboard/habitos')
    // revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    const totalTime = performance.now() - startTime
    console.error('🔴 logHabitProgress: ERROR after', totalTime, 'ms', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Acción específica para el tracker de agua - OPTIMIZADA
 */
export async function logWaterGlass(): Promise<{ success: boolean; newValue?: number; error?: string }> {
  console.log('🔵 logWaterGlass: START')
  const startTime = performance.now()

  try {
    const member = await getCurrentMember()
    if (!member) throw new Error('No authenticated member found')
    console.log('🔵 Member fetched:', performance.now() - startTime, 'ms')

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // OPTIMIZACIÓN: Una sola query con JOIN para obtener assignment + habit data
    const queryStart = performance.now()
    const { data: assignmentData } = await supabase
      .from('habit_assignments')
      .select(`
        id,
        habit_id,
        target_value,
        habits!inner (
          category
        )
      `)
      .eq('member_id', member.id)
      .eq('habits.category', 'hydration')
      .single()
    console.log('🔵 Assignment query:', performance.now() - queryStart, 'ms')

    if (!assignmentData) {
      throw new Error('Water habit assignment not found')
    }

    // OPTIMIZACIÓN: UPSERT para evitar check de existencia
    const logStart = performance.now()
    const { data: existingLog } = await supabase
      .from('habit_logs')
      .select('value')
      .eq('member_id', member.id)
      .eq('habit_id', assignmentData.habit_id)
      .eq('date', today)
      .single()
    console.log('🔵 Log query:', performance.now() - logStart, 'ms')

    const currentValue = existingLog?.value || 0
    const newValue = currentValue + 1
    const completed = newValue >= assignmentData.target_value

    // UPSERT: Update si existe, Insert si no existe
    const upsertStart = performance.now()
    const { error } = await supabase
      .from('habit_logs')
      .upsert({
        member_id: member.id,
        habit_id: assignmentData.habit_id,
        date: today,
        value: newValue,
        completed,
      }, {
        onConflict: 'member_id,habit_id,date'
      })
    console.log('🔵 Upsert query:', performance.now() - upsertStart, 'ms')

    if (error) throw error

    const totalTime = performance.now() - startTime
    console.log('🟢 logWaterGlass: SUCCESS in', totalTime, 'ms')
    return { success: true, newValue }
  } catch (error) {
    const totalTime = performance.now() - startTime
    console.error('🔴 logWaterGlass: ERROR after', totalTime, 'ms', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}