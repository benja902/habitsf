'use client'

import { useEffect, useState, useRef } from 'react'
import {CheckSquare, ListTodo, AlertTriangle, ChevronRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { getDashboardData } from '@/features/dashboard/actions/dashboard'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

export function Dashboard() {
  const [data, setData] = useState<DashboardData>(null)
  const [loading, setLoading] = useState(true)

  // Cache con timestamp (mismo patrón que otros módulos exitosos)
  const lastFetchRef = useRef<{ timestamp: number }>({
    timestamp: 0
  })

  const loadData = async (force = false) => {
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchRef.current.timestamp

    // Cache de 3 minutos (mismo que daily-dashboard, pantalla principal)
    if (!force && timeSinceLastFetch < 180000) {
      console.log('🟡 loadDashboard: SKIPPED (cached, last fetch', timeSinceLastFetch, 'ms ago)')
      return
    }

    console.log('🟡 loadDashboard: START')
    const startTime = performance.now()

    setLoading(true)
    try {
      const result = await getDashboardData()
      const totalTime = performance.now() - startTime
      console.log('🟢 loadDashboard: SUCCESS in', totalTime, 'ms')

      // Actualizar cache
      lastFetchRef.current = {
        timestamp: now
      }

      setData(result)
    } catch (error) {
      const totalTime = performance.now() - startTime
      console.error('🔴 loadDashboard: ERROR after', totalTime, 'ms', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🟡 Dashboard useEffect triggered')

    // Debounce: esperar 100ms (mismo patrón que otros módulos)
    const timeout = setTimeout(() => {
      loadData(false) // No forzar, usar cache si es reciente
    }, 100)

    return () => clearTimeout(timeout)
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!data) {
    return (
      <div className="bg-red-50 rounded-2xl p-4 md:p-5">
        <p className="text-sm text-red-600">
          Error al cargar datos. Verifica tu conexión con Supabase.
        </p>
      </div>
    )
  }

  const { member, habits, tasks, consequences, points } = data

  const stats = [
    {
      title: 'Hábitos',
      value: habits.completed,
      total: habits.total,
      icon: CheckSquare,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      href: '/habitos',
    },
    {
      title: 'Tareas',
      value: tasks.completed,
      total: tasks.total,
      icon: ListTodo,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      href: '/tareas',
    },
    {
      title: 'Alertas',
      value: consequences.length,
      icon: AlertTriangle,
      color: consequences.length > 0 ? 'text-orange-500' : 'text-gray-400',
      bgColor: consequences.length > 0 ? 'bg-orange-50' : 'bg-gray-50',
      href: '/consecuencias',
    },
  ]

  const displayName = member.nickname || member.name
  const greeting = getGreeting()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pt-2">
        <p className="text-gray-500 text-sm font-medium">{greeting}</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mt-1">
          {displayName}
        </h1>
      </div>

      {/* Points Card (si tiene puntos) */}
      {points.today > 0 && (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Puntos de hoy</p>
              <p className="text-3xl font-bold mt-1">{points.today}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-xs">Esta semana</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4" />
                <p className="text-xl font-semibold">{points.week}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {stats.map((stat) => {
          const progress = stat.total && stat.total > 0 ? (stat.value / stat.total) * 100 : 0
          const isComplete = stat.total && stat.total > 0 && stat.value === stat.total

          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 hover:border-gray-200 transition-all duration-200 active:scale-[0.98] relative overflow-hidden"
            >
              {/* Progress bar background */}
              {stat.total && stat.total > 0 && (
                <div
                  className={`absolute inset-0 ${stat.bgColor} opacity-20 transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              )}

              <div className="relative">
                <div className={`inline-flex p-2 rounded-xl ${stat.bgColor} mb-3`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} strokeWidth={2} />
                </div>
                <div className="text-2xl md:text-3xl font-semibold text-gray-900">
                  {stat.value}
                  {stat.total !== undefined && (
                    <span className="text-gray-300 text-lg md:text-xl">/{stat.total}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs md:text-sm text-gray-500">{stat.title}</p>
                  {isComplete && <span className="text-xs">✨</span>}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Consecuencias activas (si hay) */}
      {consequences.length > 0 && (
        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <p className="font-medium text-gray-900">Consecuencias pendientes</p>
          </div>
          <div className="space-y-2">
            {(consequences as any[]).slice(0, 2).map((cons: any) => (
              <div key={cons.id} className="flex items-center gap-2 text-sm">
                <Badge variant={cons.status === 'pending' ? 'destructive' : 'secondary'}>
                  {cons.status === 'pending' ? 'Pendiente' : 'En progreso'}
                </Badge>
                <p className="text-gray-700 flex-1 truncate">{cons.title}</p>
              </div>
            ))}
          </div>
          {consequences.length > 2 && (
            <Link
              href="/consecuencias"
              className="text-sm text-orange-600 font-medium mt-2 inline-block"
            >
              Ver {consequences.length - 2} más →
            </Link>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Acceso rápido</h2>

        <div className="space-y-2">
          <Link
            href="/mi-dia"
            className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-all duration-200 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <span className="text-lg">📋</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Mi Día</p>
                <p className="text-sm text-gray-500">
                  {habits.pending + tasks.total - tasks.completed} pendientes
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </Link>

          <Link
            href="/familia"
            className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-all duration-200 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <span className="text-lg">👨‍👩‍👧‍👦</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Familia</p>
                <p className="text-sm text-gray-500">Ver estadísticas</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="pt-2">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-40" />
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100">
            <Skeleton className="h-10 w-10 rounded-xl mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}
