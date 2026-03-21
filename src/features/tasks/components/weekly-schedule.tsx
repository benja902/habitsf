'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getWeeklySchedule, type RotativeScheduleItem } from '@/features/tasks/actions'
import { Loader2, Calendar, Users, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface State {
  schedule: { [key: string]: RotativeScheduleItem[] }
  loading: boolean
  error: string | null
}

// Mapeo de días para mostrar en español
const dayNames: { [key: string]: string } = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

// Obtener el día actual para resaltar
function getTodayKey(): string {
  const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return daysMap[new Date().getDay()]
}

export function WeeklySchedule() {
  const [state, setState] = useState<State>({
    schedule: {},
    loading: true,
    error: null,
  })

  const todayKey = getTodayKey()

  const loadSchedule = async () => {
    console.log('🟡 loadSchedule: START')
    const startTime = performance.now()

    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const schedule = await getWeeklySchedule()
      const totalTime = performance.now() - startTime
      console.log('🟢 loadSchedule: SUCCESS in', totalTime, 'ms')

      setState({
        schedule,
        loading: false,
        error: null,
      })
    } catch (error) {
      const totalTime = performance.now() - startTime
      console.error('🔴 loadSchedule: ERROR after', totalTime, 'ms', error)
      setState({
        schedule: {},
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar rotación',
      })
    }
  }

  useEffect(() => {
    loadSchedule()
  }, [])

  if (state.loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rotación Semanal</h1>
            <p className="text-gray-600 mt-1">
              Calendario de tareas rotativas
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando rotación semanal...</span>
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
            <h1 className="text-3xl font-bold">Rotación Semanal</h1>
            <p className="text-gray-600 mt-1">
              Calendario de tareas rotativas
            </p>
          </div>
        </div>

        <div className="text-center py-12">
          <div className="text-red-600 mb-2">Error al cargar rotación</div>
          <div className="text-gray-600 text-sm">{state.error}</div>
          <button
            onClick={() => loadSchedule()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Obtener todas las tareas únicas
  const allTasks = new Set<string>()
  Object.values(state.schedule).forEach(dayTasks => {
    dayTasks.forEach(item => allTasks.add(item.task_name))
  })

  // Obtener todos los miembros únicos
  const allMembers = new Set<string>()
  Object.values(state.schedule).forEach(dayTasks => {
    dayTasks.forEach(item => allMembers.add(item.member_name))
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rotación Semanal</h1>
          <p className="text-gray-600 mt-1">
            Calendario de tareas rotativas familiares
          </p>
        </div>
        <Link href="/tareas">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a Tareas
          </Button>
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Días Configurados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {Object.keys(state.schedule).length}
            </p>
            <p className="text-sm text-gray-600">días de la semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Miembros Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {allMembers.size}
            </p>
            <p className="text-sm text-gray-600">participando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              Tareas Rotativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {allTasks.size}
            </p>
            <p className="text-sm text-gray-600">diferentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de rotación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario Semanal
          </CardTitle>
          <CardDescription>
            Rotación de tareas por día de la semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Día</TableHead>
                  <TableHead className="font-semibold">Tareas Asignadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(state.schedule).map(([dayKey, dayTasks]) => (
                  <TableRow
                    key={dayKey}
                    className={todayKey === dayKey ? 'bg-blue-50 border-blue-200' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          todayKey === dayKey ? 'text-blue-700' : 'text-gray-900'
                        }`}>
                          {dayNames[dayKey]}
                        </span>
                        {todayKey === dayKey && (
                          <Badge variant="default" className="text-xs">
                            Hoy
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {dayTasks.length === 0 ? (
                        <span className="text-gray-400 italic">Sin tareas</span>
                      ) : (
                        <div className="space-y-2">
                          {dayTasks.map((task, index) => (
                            <div
                              key={`${task.task_id}-${task.member_id}`}
                              className="flex items-center justify-between p-2 rounded-md bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-900">
                                  {task.task_name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {task.member_name}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resumen por miembro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Resumen por Miembro
          </CardTitle>
          <CardDescription>
            Tareas asignadas por persona durante la semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from(allMembers).map(memberName => {
              // Contar tareas por miembro
              const memberTasks = Object.values(state.schedule)
                .flat()
                .filter(task => task.member_name === memberName)

              return (
                <div key={memberName} className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {memberName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {memberTasks.length} tareas semanales
                  </p>
                  <div className="space-y-1">
                    {memberTasks.map((task, index) => (
                      <div key={index} className="text-xs text-gray-500">
                        {dayNames[task.day_of_week]}: {task.task_name}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}