'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Validar que el member_id pertenece al usuario autenticado
 * Evita refetch completo de getCurrentMember()
 */
export async function validateMemberOwnership(memberId: string): Promise<boolean> {
  console.log('🔵 validateMemberOwnership: START for', memberId)
  const startTime = performance.now()

  try {
    const supabase = await createClient()

    // Solo obtener user (no member refetch)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('🔴 validateMemberOwnership: No authenticated user')
      return false
    }

    // Verificar que el member_id pertenece a este user
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('user_id')  // Solo necesitamos verificar ownership
      .eq('id', memberId)
      .eq('user_id', user.id)
      .single()

    const totalTime = performance.now() - startTime
    const isValid = !memberError && !!member

    console.log(
      isValid ? '🟢' : '🔴',
      'validateMemberOwnership:',
      isValid ? 'VALID' : 'INVALID',
      'in', totalTime, 'ms'
    )

    return isValid
  } catch (error) {
    const totalTime = performance.now() - startTime
    console.error('🔴 validateMemberOwnership: ERROR after', totalTime, 'ms', error)
    return false
  }
}