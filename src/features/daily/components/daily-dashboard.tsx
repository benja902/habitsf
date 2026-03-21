'use client'

import { useCurrentMember } from '@/features/auth/hooks'
import { getTodayHabits, type HabitWithProgress } from '@/features/habits/actions'
import { getTodayTasks, type TaskWithProgress } from '@/features/tasks/actions'
import {
  Loader2,
  CheckCircle2,
  Circle,
  Droplet,
  Dumbbell,
  BookOpen,
  Target,
  ListTodo,
  Calendar,
  TrendingUp,
  Utensils,
  Wind,
  Droplets,
  Trash2,
  Bath
} from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { logWaterGlass, logHabitProgress } from '@/features/habits/actions'
import { markTaskComplete, markTaskIncomplete } from '@/features/tasks/actions'

interface DailyState {
  habits: HabitWithProgress[]
  tasks: TaskWithProgress[]
  loading: boolean
  error: string | null
}

// Helper functions para iconos
const getHabitIcon = (category: string) => {
  switch (category) {
    case 'hydration': return Droplet
    case 'exercise': return Dumbbell
    case 'study': return BookOpen
    default: return Target
  }
}

const getTaskIcon = (icon: string | null) => {
  switch (icon) {
    case 'utensils': return Utensils
    case 'wind': return Wind
    case 'droplet': return Droplets
    case 'trash-2': return Trash2
    case 'bath': return Bath
    default: return Circle
  }
}

export function DailyDashboard() {
  const { member, loading: memberLoading } = useCurrentMember()
  const [state, setState] = useState<DailyState>({
    habits: [],
    tasks: [],
    loading: true,
    error: null,
  })

  // Cache con timestamp (mismo patrón que otros módulos)
  const lastFetchRef = useRef<{ timestamp: number; memberId: string | null }>({
    timestamp: 0,
    memberId: null
  })

  const loadDailyData = async (force = false) => {
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchRef.current.timestamp
    const isSameMember = lastFetchRef.current.memberId === member?.id

    // Cache agresivo de 3 minutos (mas frecuente para dashboard principal)
    if (!force && isSameMember && timeSinceLastFetch < 180000) {
      console.log('🟡 loadDailyData: SKIPPED (cached, last fetch', timeSinceLastFetch, 'ms ago)')
      return
    }

    console.log('🟡 loadDailyData: START')
    const startTime = performance.now()

    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      // Cargar ambos en paralelo
      const [habits, tasks] = await Promise.all([
        getTodayHabits(),
        getTodayTasks()
      ])

      const totalTime = performance.now() - startTime
      console.log('🟢 loadDailyData: SUCCESS in', totalTime, 'ms')

      // Actualizar cache
      lastFetchRef.current = {
        timestamp: now,
        memberId: member?.id || null
      }

      setState({
        habits,
        tasks,
        loading: false,
        error: null,
      })
    } catch (error) {
      const totalTime = performance.now() - startTime
      console.error('🔴 loadDailyData: ERROR after', totalTime, 'ms', error)
      setState({
        habits: [],
        tasks: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar datos del día',
      })
    }
  }

  useEffect(() => {
    console.log('🟡 DailyDashboard useEffect - member:', !!member, 'memberLoading:', memberLoading)
    if (member && !memberLoading) {
      const timeout = setTimeout(() => {
        loadDailyData(false)
      }, 100)

      return () => clearTimeout(timeout)
    }
  }, [member, memberLoading])

  // Handlers para interacciones
  const handleHabitClick = async (habit: HabitWithProgress) => {
    if ((habit as any).habits?.category === 'hydration') {
      // Handler especial para agua
      const currentGlasses = habit.today_log?.value || 0
      if (currentGlasses >= (habit as any).target_value) return

      try {
        const result = await logWaterGlass()
        if (result.success && result.newValue !== undefined) {
          // Optimistic update
          setState(prev => ({
            ...prev,
            habits: prev.habits.map(h =>
              h.id === habit.id
                ? {
                    ...h,
                    today_log: {
                      ...h.today_log,
                      id: h.today_log?.id || '',
                      habit_id: (h as any).habit_id,
                      member_id: h.today_log?.member_id || '',
                      date: new Date().toISOString().split('T')[0],
                      value: result.newValue!,
                      completed: result.newValue! >= (h as any).target_value,
                      created_at: h.today_log?.created_at || new Date().toISOString(),
                    },
                    progress: Math.min((result.newValue! / (h as any).target_value) * 100, 100),
                    completed: result.newValue! >= (h as any).target_value,
                  }
                : h
            )
          }))
        }
      } catch (error) {
        console.error('Error adding water glass:', error)
      }
    } else {
      // Handler genérico para otros hábitos (marcar como completo)
      if (habit.completed) return

      try {
        const result = await logHabitProgress((habit as any).habit_id, (habit as any).target_value)
        if (result.success) {
          // Optimistic update
          setState(prev => ({
            ...prev,
            habits: prev.habits.map(h =>
              h.id === habit.id
                ? {
                    ...h,
                    today_log: {
                      ...h.today_log,
                      id: h.today_log?.id || '',
                      habit_id: (h as any).habit_id,
                      member_id: h.today_log?.member_id || '',
                      date: new Date().toISOString().split('T')[0],
                      value: (h as any).target_value,
                      completed: true,
                      created_at: h.today_log?.created_at || new Date().toISOString(),
                    },
                    progress: 100,
                    completed: true,
                  }
                : h
            )
          }))
        }
      } catch (error) {
        console.error('Error completing habit:', error)
      }
    }
  }

  const handleTaskToggle = async (task: TaskWithProgress) => {
    try {
      const result = task.completed
        ? await markTaskIncomplete(task.task_id)
        : await markTaskComplete(task.task_id)

      if (result.success) {
        // Optimistic update
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t =>
            t.id === task.id
              ? { ...t, completed: !t.completed }
              : t
          )
        }))
      }
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  if (memberLoading || state.loading) {
    return (
      <div className="space-y-6">
        <div className="pt-2">
          <p className="text-gray-500 text-sm font-medium">Hoy</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mt-1">Mi Día</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando tu día...</span>
          </div>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="space-y-6">
        <div className="pt-2">
          <p className="text-gray-500 text-sm font-medium">Hoy</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mt-1">Mi Día</h1>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 mb-2">Error al cargar datos</div>
          <div className="text-gray-600 text-sm">{state.error}</div>
          <button
            onClick={() => loadDailyData(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Métricas del día
  const completedHabits = state.habits.filter(h => h.completed)
  const completedTasks = state.tasks.filter(t => t.completed)
  const totalItems = state.habits.length + state.tasks.length
  const completedItems = completedHabits.length + completedTasks.length
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  // Separar hábitos especiales
  const hydrationHabits = state.habits.filter(h => (h as any).habits?.category === 'hydration')
  const otherHabits = state.habits.filter(h => (h as any).habits?.category !== 'hydration')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="pt-2">
          <p className="text-gray-500 text-sm font-medium">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mt-1">
            Mi Día
          </h1>
        </div>

        {/* Enlaces rápidos */}
        <div className="flex gap-2">
          <Link href="/habitos">
            <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
              <Target className="h-4 w-4" />
              Hábitos
            </Button>
          </Link>
          <Link href="/tareas">
            <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Tareas
            </Button>
          </Link>
        </div>
      </div>

      {/* Progreso general del día */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">Progreso del día</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {completedItems}/{totalItems}
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {completedHabits.length} hábitos • {completedTasks.length} tareas completadas
        </div>
      </div>

      {/* Hidratación especial */}
      {hydrationHabits.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Droplet className="h-5 w-5 text-blue-500" />
              Hidratación
            </h2>
            <Link href="/habitos">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                Ver detalles
              </Button>
            </Link>
          </div>

          {hydrationHabits.map((habit) => {
            const currentGlasses = habit.today_log?.value || 0
            const targetGlasses = (habit as any).target_value

            return (
              <div key={habit.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">{(habit as any).habits?.name}</span>
                  <Badge variant={currentGlasses >= targetGlasses ? "default" : "secondary"}>
                    {currentGlasses}/{targetGlasses}
                  </Badge>
                </div>

                {/* Vasos de agua */}
                <div className="flex items-center gap-2">
                  {[...Array(targetGlasses)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleHabitClick(habit)}
                      disabled={i < currentGlasses || currentGlasses >= targetGlasses}
                      className={`p-2 rounded-lg transition-all ${
                        i < currentGlasses
                          ? 'text-blue-500 bg-blue-50'
                          : 'text-gray-300 hover:text-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <Droplet className="h-6 w-6" fill={i < currentGlasses ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Otros Hábitos */}
      {otherHabits.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Hábitos</h2>
            <Link href="/habitos">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                Ver todos
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {otherHabits.map((habit) => {
              const IconComponent = getHabitIcon((habit as any).habits?.category || '')

              return (
                <button
                  key={habit.id}
                  onClick={() => handleHabitClick(habit)}
                  disabled={habit.completed}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors active:bg-gray-100 first:rounded-t-2xl last:rounded-b-2xl disabled:opacity-60"
                >
                  {habit.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <IconComponent className="h-6 w-6 text-gray-300" />
                  )}
                  <span className={`flex-1 ${habit.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {(habit as any).habits?.name}
                  </span>
                  {habit.completed && (
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      Completado
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Tareas */}
      {state.tasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Tareas de hoy</h2>
            <Link href="/tareas">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                Ver todas
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {state.tasks.map((task) => {
              const IconComponent = getTaskIcon(task.icon)

              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskToggle(task)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors active:bg-gray-100 first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="flex items-center gap-3">
                    {task.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <IconComponent className="h-6 w-6 text-gray-300" />
                    )}
                    <span className={task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}>
                      {task.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.completed ? (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        Completado
                      </Badge>
                    ) : (
                      <Badge variant={task.is_rotative ? "default" : "secondary"} className="text-xs">
                        {task.is_rotative ? "Rotativa" : "Fija"}
                      </Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Estado cuando todo está completado */}
      {totalItems > 0 && completedItems === totalItems && (
        <div className="text-center py-8 bg-green-50 rounded-2xl border border-green-200">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-green-800 mb-2">
            ¡Día completado! 🎉
          </h3>
          <p className="text-green-700">
            Has completado todos tus hábitos y tareas de hoy
          </p>
        </div>
      )}

      {/* Estado cuando no hay nada asignado */}
      {totalItems === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay actividades para hoy
          </h3>
          <p className="text-gray-600">
            Disfruta tu día libre ✨
          </p>
        </div>
      )}
    </div>
  )
}