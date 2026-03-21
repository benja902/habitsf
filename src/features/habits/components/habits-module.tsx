'use client'

import { useCurrentMember } from '@/features/auth/hooks'
import { getTodayHabits, type HabitWithProgress } from '@/features/habits/actions'
import { Loader2, Target, Droplet } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { HydrationTracker } from './hydration-tracker'
import { HabitCard } from './habit-card'

interface State {
  habits: HabitWithProgress[]
  loading: boolean
  error: string | null
}

export function HabitsModule() {
  const { member, loading: memberLoading } = useCurrentMember()
  const [state, setState] = useState<State>({
    habits: [],
    loading: true,
    error: null,
  })

  // Cache con timestamp para evitar re-fetches innecesarios
  const lastFetchRef = useRef<{ timestamp: number; memberId: string | null }>({
    timestamp: 0,
    memberId: null
  })

  const loadHabits = async (force = false) => {
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchRef.current.timestamp
    const isSameMember = lastFetchRef.current.memberId === member?.id

    // Solo fetch si es forzado, es otro miembro, o pasaron más de 5 minutos (300s)
    // Con latencia Peru->US East, necesitamos caché mucho más agresivo
    if (!force && isSameMember && timeSinceLastFetch < 300000) {
      console.log('🟡 loadHabits: SKIPPED (cached, last fetch', timeSinceLastFetch, 'ms ago)')
      return
    }

    console.log('🟡 loadHabits: START')
    const startTime = performance.now()

    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const habits = await getTodayHabits()
      const totalTime = performance.now() - startTime
      console.log('🟢 loadHabits: SUCCESS in', totalTime, 'ms')

      // Actualizar cache
      lastFetchRef.current = {
        timestamp: now,
        memberId: member?.id || null
      }

      setState({
        habits,
        loading: false,
        error: null,
      })
    } catch (error) {
      const totalTime = performance.now() - startTime
      console.error('🔴 loadHabits: ERROR after', totalTime, 'ms', error)
      setState({
        habits: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar hábitos',
      })
    }
  }

  useEffect(() => {
    console.log('🟡 useEffect triggered - member:', !!member, 'memberLoading:', memberLoading)
    if (member && !memberLoading) {
      console.log('🟡 Calling loadHabits from useEffect')

      // Debounce: esperar 100ms para evitar multiple calls si member cambia rápido
      const timeout = setTimeout(() => {
        loadHabits(false) // No forzar, usar cache si es reciente
      }, 100)

      return () => clearTimeout(timeout)
    }
  }, [member, memberLoading])

  // Debug: Window focus/blur events
  useEffect(() => {
    const handleFocus = () => console.log('🔍 Window FOCUS')
    const handleBlur = () => console.log('🔍 Window BLUR')

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  if (memberLoading || state.loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Hábitos</h1>
            <p className="text-gray-600 mt-1">
              Progreso de hoy
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando tus hábitos...</span>
          </div>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Hábitos</h1>
            <p className="text-gray-600 mt-1">
              Progreso de hoy
            </p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="text-red-800 font-medium mb-2">Error al cargar hábitos</h3>
          <p className="text-red-700 text-sm">{state.error}</p>
          <button
            onClick={loadHabits}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-lg text-sm transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (state.habits.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Hábitos</h1>
            <p className="text-gray-600 mt-1">
              Progreso de hoy
            </p>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-gray-800 font-medium mb-2">No tienes hábitos asignados</h3>
          <p className="text-gray-600 text-sm">
            Los administradores de la familia pueden asignarte hábitos desde el panel de administración.
          </p>
        </div>
      </div>
    )
  }

  // Separar hábitos por categoría
  const hydrationHabits = state.habits.filter(h => h.habits.category === 'hydration')
  const exerciseHabits = state.habits.filter(h => h.habits.category === 'exercise')
  const studyHabits = state.habits.filter(h => h.habits.category === 'study')
  const otherHabits = state.habits.filter(h => !['hydration', 'exercise', 'study'].includes(h.habits.category))

  const totalCompleted = state.habits.filter(h => h.completed).length
  const totalHabits = state.habits.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Hábitos</h1>
          <p className="text-gray-600 mt-1">
            {totalCompleted} de {totalHabits} completados hoy
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-2xl p-3 border border-gray-100">
          <Target className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">
            {Math.round((totalCompleted / totalHabits) * 100)}%
          </span>
        </div>
      </div>

      {/* Tracker de Hidratación */}
      {hydrationHabits.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800">Hidratación</h2>
          </div>
          {hydrationHabits.map((habit) => (
            <HydrationTracker
              key={habit.id}
              habit={habit}
              onUpdate={(newValue) => {
                // Optimistic update - actualizar solo este habit localmente sin re-fetch
                const newProgress = Math.min((newValue / habit.target_value) * 100, 100)
                const newCompleted = newValue >= habit.target_value

                setState(prev => ({
                  ...prev,
                  habits: prev.habits.map(h =>
                    h.id === habit.id
                      ? {
                          ...h,
                          today_log: {
                            ...h.today_log,
                            id: h.today_log?.id || '',
                            habit_id: h.habit_id,
                            member_id: h.today_log?.member_id || '',
                            date: new Date().toISOString().split('T')[0],
                            value: newValue,
                            completed: newCompleted,
                            created_at: h.today_log?.created_at || new Date().toISOString(),
                          },
                          progress: newProgress,
                          completed: newCompleted,
                        }
                      : h
                  )
                }))
              }}
            />
          ))}
        </div>
      )}

      {/* Otros Hábitos */}
      {(exerciseHabits.length > 0 || studyHabits.length > 0 || otherHabits.length > 0) && (
        <div className="space-y-4">
          {exerciseHabits.concat(studyHabits, otherHabits).map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onUpdate={(newValue) => {
                // Optimistic update - actualizar solo este habit localmente sin re-fetch
                const newProgress = Math.min((newValue / habit.target_value) * 100, 100)
                const newCompleted = newValue >= habit.target_value

                setState(prev => ({
                  ...prev,
                  habits: prev.habits.map(h =>
                    h.id === habit.id
                      ? {
                          ...h,
                          today_log: {
                            ...h.today_log,
                            id: h.today_log?.id || '',
                            habit_id: h.habit_id,
                            member_id: h.today_log?.member_id || '',
                            date: new Date().toISOString().split('T')[0],
                            value: newValue,
                            completed: newCompleted,
                            created_at: h.today_log?.created_at || new Date().toISOString(),
                          },
                          progress: newProgress,
                          completed: newCompleted,
                        }
                      : h
                  )
                }))
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}