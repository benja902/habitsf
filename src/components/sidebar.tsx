'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCurrentMember } from '@/features/auth/hooks'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  ListTodo,
  AlertTriangle,
  Users,
  LogOut,
  User,
  Crown,
} from 'lucide-react'

const navigation = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Mi Dia', href: '/mi-dia', icon: CalendarDays },
  { name: 'Habitos', href: '/habitos', icon: CheckSquare },
  { name: 'Tareas', href: '/tareas', icon: ListTodo },
  { name: 'Alertas', href: '/consecuencias', icon: AlertTriangle },
  { name: 'Familia', href: '/familia', icon: Users },
]

// Mobile bottom navigation (5 main items)
const mobileNav = navigation.slice(0, 5)

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { member, loading } = useCurrentMember()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Obtener iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const displayName = member?.nickname || member?.name || 'Usuario'
  const initials = member ? getInitials(member.name) : 'U'
  const roleLabel = member?.role === 'admin' ? 'Admin' : 'Miembro'

  return (
    <>
      {/* Mobile: Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 safe-area-pt">
        <div className="flex justify-between items-center h-14 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-semibold text-lg text-gray-900">HabitsF</span>
          </Link>

          {/* User menu */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="rounded-full" />
              }
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold">
                  {loading ? <User className="h-4 w-4" /> : initials}
                </AvatarFallback>
              </Avatar>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Mi Cuenta</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                      {loading ? <User className="h-6 w-6" /> : initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{displayName}</p>
                      {member?.role === 'admin' && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <Badge
                      variant={member?.role === 'admin' ? 'default' : 'secondary'}
                      className="text-xs mt-1"
                    >
                      {roleLabel}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    handleLogout()
                    setIsSheetOpen(false)
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  Cerrar sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Mobile: Bottom Navigation Bar (iOS style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 safe-area-pb">
        <div className="flex justify-around items-center h-16 px-2">
          {mobileNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200',
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-400 active:scale-95'
                )}
              >
                <item.icon className={cn(
                  'h-6 w-6 transition-transform duration-200',
                  isActive && 'scale-110'
                )} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn(
                  'text-[10px] font-medium',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop: Side Navigation */}
      <aside className="hidden md:flex h-screen w-64 flex-col bg-gray-50/50 border-r border-gray-100 fixed left-0 top-0">
        {/* Logo */}
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-semibold text-lg text-gray-900">HabitsF</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          {member && (
            <div className="flex items-center gap-2 px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500">{roleLabel}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-500 hover:text-gray-900 hover:bg-white/60 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" strokeWidth={1.5} />
            Cerrar sesión
          </Button>
        </div>
      </aside>
    </>
  )
}
