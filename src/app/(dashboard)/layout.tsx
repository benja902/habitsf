import { Sidebar } from '@/components/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { CurrentMemberProvider } from '@/features/auth/contexts/current-member-context'
// Debug tools - solo en desarrollo
import '@/features/_debug/supabase-latency-test'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CurrentMemberProvider>
      <div className="min-h-screen bg-white md:bg-gray-50/50">
        <Sidebar />
        <main className="md:ml-64 min-h-screen pb-20 md:pb-0 pt-14 md:pt-0">
          <div className="p-4 md:p-8 max-w-4xl mx-auto">
            {children}
          </div>
        </main>
        <Toaster />
      </div>
    </CurrentMemberProvider>
  )
}
