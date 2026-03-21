'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FamilyMember } from '@/types/database'

interface CurrentMemberState {
  member: FamilyMember | null
  loading: boolean
  error: string | null
}

/**
 * Hook para obtener el family_member del usuario autenticado
 */
export function useCurrentMember() {
  const [state, setState] = useState<CurrentMemberState>({
    member: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const supabase = createClient()

    const fetchMember = async () => {
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

        // Obtener family_member vinculado
        const { data: member, error: memberError } = await supabase
          .from('family_members')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (memberError) {
          throw memberError
        }

        setState({ member, loading: false, error: null })
      } catch (error) {
        console.error('Error fetching current member:', error)
        setState({
          member: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    fetchMember()

    // Suscribirse a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchMember()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return state
}
