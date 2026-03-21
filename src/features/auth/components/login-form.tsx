'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm px-6">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
          <span className="text-white font-bold text-2xl">H</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">HabitsF</h1>
        <p className="text-gray-500 text-sm mt-1">Gestion familiar</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            id="email"
            type="email"
            placeholder="Correo electronico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full h-12 px-4 bg-gray-100 rounded-xl border-0 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 outline-none"
          />
        </div>
        <div>
          <input
            id="password"
            type="password"
            placeholder="Contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full h-12 px-4 bg-gray-100 rounded-xl border-0 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 outline-none"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ingresando...
            </>
          ) : (
            'Ingresar'
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-8">
        Panel familiar privado
      </p>
    </div>
  )
}
