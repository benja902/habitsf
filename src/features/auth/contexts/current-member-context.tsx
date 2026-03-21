'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FamilyMember } from '@/types/database'

interface CurrentMemberState {
  member: FamilyMember | null
  loading: boolean
  error: string | null
}

const CurrentMemberContext = createContext<CurrentMemberState>({
  member: null,
  loading: true,
  error: null,
})

interface Props {
  children: ReactNode
}

/**
 * Provider que cachea el current member globalmente
 * Evita re-fetching en cada navegación
 */
export function CurrentMemberProvider({ children }: Props) {
  const [state, setState] = useState<CurrentMemberState>({
    member: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const supabase = createClient()

    // Flag GLOBAL para evitar fetches simultáneos (fuera del scope local)
    let isFetchingRef = { current: false }
    // Caché más agresivo para latencia Peru -> US East
    let lastSuccessfulFetch = { current: 0 }

    const fetchMember = async () => {
      if (isFetchingRef.current) {
        console.log('🔵 fetchMember: SKIPPED (already fetching)')
        return
      }

      // Con latencia alta, cache member por 10 minutos
      const timeSinceLastFetch = Date.now() - lastSuccessfulFetch.current
      if (timeSinceLastFetch < 600000) {
        console.log('🔵 fetchMember: SKIPPED (cached for', timeSinceLastFetch, 'ms)')
        return
      }

      console.log('🔵 fetchMember: START')
      const startTime = performance.now()
      isFetchingRef.current = true

      try {
        // Obtener usuario autenticado
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          throw authError
        }

        if (!user) {
          setState({ member: null, loading: false, error: 'No authenticated user' })
          return
        }

        console.log('🔵 User fetched, getting member...')

        // Obtener family_member vinculado
        const { data: member, error: memberError } = await supabase
          .from('family_members')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (memberError) {
          throw memberError
        }

        const totalTime = performance.now() - startTime
        console.log('🟢 fetchMember: SUCCESS in', totalTime, 'ms')
        lastSuccessfulFetch.current = Date.now() // Marcar cache exitoso
        setState({ member, loading: false, error: null })
      } catch (error) {
        const totalTime = performance.now() - startTime
        console.error('🔴 fetchMember: ERROR after', totalTime, 'ms', error)
        setState({
          member: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      } finally {
        isFetchingRef.current = false
      }
    }

    // Initial fetch
    fetchMember()

    // MUCHÍSIMO más restrictivo en auth events
    let authTimeout: NodeJS.Timeout

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔵 Auth state change:', event, !!session?.user)

      // SOLO fetch en logout real, ignorar TODO el resto
      if (event === 'SIGNED_OUT') {
        console.log('🔵 Auth: User signed out, triggering fetchMember')
        clearTimeout(authTimeout)
        authTimeout = setTimeout(() => {
          fetchMember()
        }, 200)
      } else {
        console.log('🔵 Auth event IGNORED:', event)
      }
    })

    return () => {
      clearTimeout(authTimeout)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <CurrentMemberContext.Provider value={state}>
      {children}
    </CurrentMemberContext.Provider>
  )
}

/**
 * Hook optimizado que usa el contexto cacheado
 */
export function useCurrentMember() {
  const context = useContext(CurrentMemberContext)

  if (context === undefined) {
    throw new Error('useCurrentMember must be used within a CurrentMemberProvider')
  }

  return context
}