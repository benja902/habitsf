'use client'

import { useCurrentMember } from '@/features/auth/hooks'
import { getTodayTasks, type TaskWithProgress } from '@/features/tasks/actions'
import { Loader2, ListTodo, CheckCircle, Clock, Calendar } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TaskCard } from './task-card'

interface State {
  tasks: TaskWithProgress[]
  loading: boolean
  error: string | null
}

export function TasksModule() {
  const { member, loading: memberLoading } = useCurrentMember()
  const [state, setState] = useState<State>({
    tasks: [],
    loading: true,
    error: null,
  })

  // Cache con timestamp para evitar re-fetches innecesarios (mismo patrón que hábitos)
  const lastFetchRef = useRef<{ timestamp: number; memberId: string | null }>({
    timestamp: 0,
    memberId: null
  })

  const loadTasks = async (force = false) => {
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchRef.current.timestamp
    const isSameMember = lastFetchRef.current.memberId === member?.id

    // Solo fetch si es forzado, es otro miembro, o pasaron más de 5 minutos
    if (!force && isSameMember && timeSinceLastFetch < 300000) {
      console.log('🟡 loadTasks: SKIPPED (cached, last fetch', timeSinceLastFetch, 'ms ago)')
      return
    }

    console.log('🟡 loadTasks: START')
    const startTime = performance.now()

    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const tasks = await getTodayTasks()
      const totalTime = performance.now() - startTime
      console.log('🟢 loadTasks: SUCCESS in', totalTime, 'ms')

      // Actualizar cache
      lastFetchRef.current = {
        timestamp: now,
        memberId: member?.id || null
      }

      setState({
        tasks,
        loading: false,
        error: null,
      })
    } catch (error) {
      const totalTime = performance.now() - startTime
      console.error('🔴 loadTasks: ERROR after', totalTime, 'ms', error)
      setState({
        tasks: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar tareas',
      })
    }
  }

  useEffect(() => {
    console.log('🟡 useEffect triggered - member:', !!member, 'memberLoading:', memberLoading)
    if (member && !memberLoading) {
      console.log('🟡 Calling loadTasks from useEffect')

      // Debounce: esperar 100ms para evitar multiple calls
      const timeout = setTimeout(() => {
        loadTasks(false) // No forzar, usar cache si es reciente
      }, 100)

      return () => clearTimeout(timeout)
    }
  }, [member, memberLoading])

  if (memberLoading || state.loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Tareas</h1>
            <p className="text-gray-600 mt-1">
              Tareas de hoy
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando tus tareas...</span>
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
            <h1 className="text-3xl font-bold">Mis Tareas</h1>
            <p className="text-gray-600 mt-1">
              Tareas de hoy
            </p>
          </div>
        </div>

        <div className="text-center py-12">
          <div className="text-red-600 mb-2">Error al cargar tareas</div>
          <div className="text-gray-600 text-sm">{state.error}</div>
          <button
            onClick={() => loadTasks(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Métricas del día
  const completedTasks = state.tasks.filter(task => task.completed)
  const pendingTasks = state.tasks.filter(task => !task.completed)
  const totalPoints = state.tasks.reduce((sum, task) => sum + (task.completed ? task.points : 0), 0)

  // Separar tareas por tipo
  const rotativeTasks = state.tasks.filter(task => task.is_rotative)
  const fixedTasks = state.tasks.filter(task => !task.is_rotative)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Tareas</h1>
          <p className="text-gray-600 mt-1">
            Tareas de hoy - {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <Link href="/tareas/rotacion">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Ver Rotación
          </Button>
        </Link>
      </div>

      {/* Métricas del día */}
      {state.tasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <ListTodo className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {state.tasks.length}
                </p>
                <p className="text-sm text-gray-600">Tareas asignadas</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {completedTasks.length}
                </p>
                <p className="text-sm text-gray-600">Completadas</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {totalPoints}
                </p>
                <p className="text-sm text-gray-600">Puntos ganados</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de tareas */}
      {state.tasks.length === 0 ? (
        <div className="text-center py-12">
          <ListTodo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay tareas asignadas para hoy
          </h3>
          <p className="text-gray-600">
            Disfruta tu día libre 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tareas Rotativas */}
          {rotativeTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-800">Tareas Rotativas</h2>
                <span className="text-sm text-gray-600">
                  (Según rotación semanal)
                </span>
              </div>
              {rotativeTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={() => {
                    // Optimistic update local
                    setState(prev => ({
                      ...prev,
                      tasks: prev.tasks.map(t =>
                        t.id === task.id
                          ? { ...t, completed: !t.completed }
                          : t
                      )
                    }))
                  }}
                />
              ))}
            </div>
          )}

          {/* Tareas Fijas */}
          {fixedTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-800">Tareas Fijas</h2>
                <span className="text-sm text-gray-600">
                  (Asignadas específicamente)
                </span>
              </div>
              {fixedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={() => {
                    // Optimistic update local
                    setState(prev => ({
                      ...prev,
                      tasks: prev.tasks.map(t =>
                        t.id === task.id
                          ? { ...t, completed: !t.completed }
                          : t
                      )
                    }))
                  }}
                />
              ))}
            </div>
          )}

          {/* Resumen */}
          {completedTasks.length > 0 && pendingTasks.length === 0 && (
            <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-800 mb-2">
                ¡Todas las tareas completadas! 🎉
              </h3>
              <p className="text-green-700">
                Has ganado {totalPoints} puntos hoy
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}