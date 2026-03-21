'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Circle,
  Clock,
  Utensils,
  Wind,
  Droplets,
  Trash2,
  Bath,
  Home,
  Star,
  Loader2
} from 'lucide-react'
import { useState } from 'react'
import { markTaskComplete, markTaskIncomplete, type TaskWithProgress } from '@/features/tasks/actions'

interface Props {
  task: TaskWithProgress
  onUpdate: () => void // Callback para actualizar la lista
}

const getTaskIcon = (icon: string | null) => {
  switch (icon) {
    case 'utensils': return Utensils
    case 'wind': return Wind
    case 'droplet': return Droplets
    case 'trash-2': return Trash2
    case 'bath': return Bath
    case 'home': return Home
    default: return Circle
  }
}

function formatTaskName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

export function TaskCard({ task, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)

  const IconComponent = getTaskIcon(task.icon)
  const isCompleted = task.completed
  const taskDisplayName = formatTaskName(task.name)

  const handleToggleComplete = async () => {
    if (loading) return

    setLoading(true)
    try {
      const result = isCompleted
        ? await markTaskIncomplete(task.task_id)
        : await markTaskComplete(task.task_id)

      if (result.success) {
        // Callback para actualizar la lista padre (optimistic update)
        onUpdate()
      } else {
        console.error('Error updating task:', result.error)
        // TODO: Mostrar toast de error
      }
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-md ${
      isCompleted
        ? 'bg-green-50 border-green-200 opacity-75'
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-3">
            <IconComponent className={`h-6 w-6 ${
              isCompleted ? 'text-green-600' : 'text-blue-600'
            }`} />
            <span className={`${isCompleted ? 'line-through text-gray-600' : 'text-gray-900'}`}>
              {taskDisplayName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge de puntos */}
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {task.points}
            </Badge>

            {/* Badge de tipo */}
            <Badge variant={task.is_rotative ? "default" : "secondary"}>
              {task.is_rotative ? "Rotativa" : "Fija"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Descripción */}
          {task.description && (
            <p className={`text-sm ${isCompleted ? 'text-gray-500' : 'text-gray-600'}`}>
              {task.description}
            </p>
          )}

          {/* Estado y acciones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    Completada
                  </span>
                  {task.today_task?.completed_at && (
                    <Badge variant="outline" className="ml-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(task.today_task.completed_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Pendiente
                  </span>
                </>
              )}
            </div>

            <Button
              onClick={handleToggleComplete}
              disabled={loading}
              variant={isCompleted ? "outline" : "default"}
              size="sm"
              className={`${
                isCompleted
                  ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isCompleted ? (
                'Deshacer'
              ) : (
                'Completar'
              )}
            </Button>
          </div>

          {/* Notas (si hay) */}
          {task.today_task?.notes && (
            <div className="mt-2 p-2 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">
                <strong>Nota:</strong> {task.today_task.notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}