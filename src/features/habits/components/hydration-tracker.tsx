'use client'

import { logWaterGlass, type HabitWithProgress } from '@/features/habits/actions'
import { Droplet, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Props {
  habit: HabitWithProgress
  onUpdate: (newValue: number) => void // Optimistic update - pasar el nuevo valor
}

export function HydrationTracker({ habit, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)

  const currentGlasses = habit.today_log?.value || 0
  const targetGlasses = habit.target_value
  const progress = Math.min((currentGlasses / targetGlasses) * 100, 100)

  const handleAddGlass = async () => {
    if (loading || currentGlasses >= targetGlasses) return

    setLoading(true)
    console.log('🔵 HydrationTracker: Click vaso, starting Server Action...')
    try {
      const result = await logWaterGlass()
      if (result.success && result.newValue !== undefined) {
        console.log('🔵 HydrationTracker: Server Action SUCCESS, updating local state')
        // Optimistic update - actualizar solo este habit localmente
        onUpdate(result.newValue)
      } else {
        console.error('Error adding glass:', result.error)
        // TODO: Mostrar toast de error
      }
    } catch (error) {
      console.error('Error adding glass:', error)
    } finally {
      setLoading(false)
    }
  }

  // Crear array de vasos para renderizar
  const glasses = Array.from({ length: targetGlasses }, (_, index) => {
    const glassNumber = index + 1
    const isFilled = glassNumber <= currentGlasses
    const isClickable = glassNumber === currentGlasses + 1 && !loading

    return {
      number: glassNumber,
      filled: isFilled,
      clickable: isClickable,
    }
  })

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-xl">
            <Droplet className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{habit.habits.name}</h3>
            <p className="text-sm text-gray-600">
              {currentGlasses} de {targetGlasses} {habit.habits.unit}
            </p>
          </div>
        </div>

        {/* Progress Badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          habit.completed
            ? 'bg-green-100 text-green-800'
            : currentGlasses > 0
            ? 'bg-blue-100 text-blue-800'
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
              habit.completed ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Glasses Grid */}
      <div className="grid grid-cols-4 gap-3 md:gap-4">
        {glasses.map((glass) => (
          <button
            key={glass.number}
            onClick={glass.clickable ? handleAddGlass : undefined}
            disabled={!glass.clickable}
            className={`
              relative aspect-[3/4] rounded-xl border-2 transition-all duration-200 flex items-end justify-center p-1
              ${glass.filled
                ? 'bg-blue-50 border-blue-300 text-blue-600'
                : glass.clickable
                ? 'bg-white border-gray-300 text-gray-400 hover:border-blue-300 hover:bg-blue-50 active:scale-95 cursor-pointer'
                : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
              }
            `}
          >
            {/* Water level */}
            {glass.filled && (
              <div className="absolute bottom-0 left-0 right-0 bg-blue-400 rounded-b-lg transition-all duration-300"
                   style={{ height: '70%' }} />
            )}

            {/* Glass number */}
            <span className="relative z-10 text-sm font-medium">
              {glass.number}
            </span>

            {/* Loading indicator */}
            {glass.clickable && loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-xl">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Action Text */}
      <div className="mt-4 text-center">
        {habit.completed ? (
          <p className="text-green-600 text-sm font-medium">
            ¡Meta alcanzada! 🎉
          </p>
        ) : currentGlasses === targetGlasses - 1 ? (
          <p className="text-blue-600 text-sm font-medium">
            ¡Un vaso más y completas tu meta!
          </p>
        ) : (
          <p className="text-gray-500 text-sm">
            Toca el siguiente vaso para registrar
          </p>
        )}
      </div>
    </div>
  )
}