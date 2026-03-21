'use client'

import { logHabitProgress, type HabitWithProgress } from '@/features/habits/actions'
import {
  Dumbbell,
  BookOpen,
  Clock,
  Check,
  Loader2,
  Plus,
  Minus
} from 'lucide-react'
import { useState } from 'react'

interface Props {
  habit: HabitWithProgress
  onUpdate: (newValue: number) => void // Optimistic update - pasar el nuevo valor
}

const getHabitIcon = (category: string) => {
  switch (category) {
    case 'exercise':
      return Dumbbell
    case 'study':
      return BookOpen
    default:
      return Clock
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'exercise':
      return {
        bg: 'bg-green-100',
        text: 'text-green-600',
        progress: 'bg-green-500',
        badge: 'bg-green-100 text-green-800',
      }
    case 'study':
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        progress: 'bg-purple-500',
        badge: 'bg-purple-100 text-purple-800',
      }
    default:
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        progress: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-800',
      }
  }
}

export function HabitCard({ habit, onUpdate }: Props) {
  const [inputValue, setInputValue] = useState(habit.today_log?.value || 0)
  const [notes, setNotes] = useState(habit.today_log?.notes || '')
  const [loading, setLoading] = useState(false)

  const Icon = getHabitIcon(habit.habits.category)
  const colors = getCategoryColor(habit.habits.category)

  const currentValue = habit.today_log?.value || 0
  const targetValue = habit.target_value
  const progress = Math.min((currentValue / targetValue) * 100, 100)

  const handleUpdateProgress = async () => {
    if (loading || inputValue < 0) return

    setLoading(true)
    try {
      const result = await logHabitProgress(habit.habit_id, inputValue, notes)
      if (result.success) {
        // Optimistic update - actualizar con el inputValue que ya eligió el usuario
        onUpdate(inputValue)
      } else {
        console.error('Error updating habit progress:', result.error)
        // TODO: Mostrar toast de error
      }
    } catch (error) {
      console.error('Error updating habit progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAdd = (amount: number) => {
    const newValue = Math.max(0, inputValue + amount)
    setInputValue(newValue)
  }

  const handleMarkComplete = async () => {
    if (loading) return

    setLoading(true)
    try {
      const result = await logHabitProgress(habit.habit_id, targetValue, notes)
      if (result.success) {
        // Optimistic update - marcar como completo con targetValue
        onUpdate(targetValue)
      } else {
        console.error('Error marking habit complete:', result.error)
      }
    } catch (error) {
      console.error('Error marking habit complete:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`${colors.bg} p-2 rounded-xl`}>
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{habit.habits.name}</h3>
            <p className="text-sm text-gray-600">
              {currentValue} de {targetValue} {habit.habits.unit}
            </p>
          </div>
        </div>

        {/* Progress Badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          habit.completed
            ? 'bg-green-100 text-green-800'
            : currentValue > 0
            ? colors.badge
            : 'bg-gray-100 text-gray-600'
        }`}>
          {habit.completed ? '¡Completado!' : `${Math.round(progress)}%`}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              habit.completed ? 'bg-green-500' : colors.progress
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Input Section */}
      {!habit.completed ? (
        <div className="space-y-4">
          {/* Value Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              ¿Cuántos {habit.habits.unit}?
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuickAdd(-5)}
                disabled={loading || inputValue <= 0}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  {habit.habits.unit}
                </div>
              </div>

              <button
                onClick={() => handleQuickAdd(5)}
                disabled={loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setInputValue(targetValue)}
              disabled={loading}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${colors.bg} ${colors.text} hover:opacity-80 disabled:opacity-50`}
            >
              Meta completa ({targetValue})
            </button>
            <button
              onClick={() => handleQuickAdd(15)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              +15
            </button>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Corrí en el parque, fue muy cansado pero me sentí bien..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleUpdateProgress}
              disabled={loading || inputValue === currentValue}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Registrar progreso
                </>
              )}
            </button>

            {inputValue >= targetValue && (
              <button
                onClick={handleMarkComplete}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                ¡Completar!
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Completed State */
        <div className="text-center py-4">
          <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-green-700 font-medium">¡Hábito completado!</p>
          <p className="text-green-600 text-sm mt-1">
            Registraste {currentValue} {habit.habits.unit}
          </p>
          {habit.today_log?.notes && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-green-700 text-sm">
                <strong>Nota:</strong> {habit.today_log.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}