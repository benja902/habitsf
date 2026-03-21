import { createClient } from '@/lib/supabase/client'

/**
 * Función de debug para testear latencia específica de Supabase
 * Ejecúta en browser console: window._testSupabaseLatency()
 */
export async function testSupabaseLatency() {
  console.log('🧪 TESTING SUPABASE LATENCY...')
  const supabase = createClient()

  // Test 1: Simple auth.getUser()
  console.log('🧪 Test 1: auth.getUser()')
  const authStart = performance.now()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const authTime = performance.now() - authStart
  console.log('🧪 auth.getUser():', authTime, 'ms', authError ? 'ERROR' : 'SUCCESS')

  if (authError || !authData.user) {
    console.log('🧪 No user authenticated, stopping tests')
    return
  }

  // Test 2: Simple SELECT * from family_members limit 1
  console.log('🧪 Test 2: SELECT family_members LIMIT 1')
  const simpleStart = performance.now()
  const { data: simpleData, error: simpleError } = await supabase
    .from('family_members')
    .select('*')
    .limit(1)
  const simpleTime = performance.now() - simpleStart
  console.log('🧪 Simple SELECT:', simpleTime, 'ms', simpleError ? 'ERROR' : 'SUCCESS')

  // Test 3: Complex query similar to getTodayHabits
  console.log('🧪 Test 3: Complex query (like getTodayHabits)')
  const complexStart = performance.now()
  const { data: complexData, error: complexError } = await supabase
    .from('habit_assignments')
    .select(`
      id,
      habit_id,
      target_value,
      habits (
        id,
        name,
        category,
        unit,
        icon,
        description,
        frequency,
        specific_days,
        is_active,
        points
      )
    `)
    .eq('member_id', authData.user.id)
    .limit(5)
  const complexTime = performance.now() - complexStart
  console.log('🧪 Complex query:', complexTime, 'ms', complexError ? 'ERROR' : 'SUCCESS')

  // Test 4: Concurrent queries (el más común en tu app)
  console.log('🧪 Test 4: Concurrent queries')
  const concurrentStart = performance.now()

  const [memberResult, habitResult] = await Promise.all([
    supabase
      .from('family_members')
      .select('*')
      .eq('user_id', authData.user.id)
      .single(),
    supabase
      .from('habit_assignments')
      .select('*')
      .eq('member_id', 'some-id')
      .limit(3)
  ])

  const concurrentTime = performance.now() - concurrentStart
  console.log('🧪 Concurrent queries:', concurrentTime, 'ms')

  console.log('🧪 LATENCY SUMMARY:')
  console.log('🧪 - Auth:', authTime, 'ms')
  console.log('🧪 - Simple SELECT:', simpleTime, 'ms')
  console.log('🧪 - Complex query:', complexTime, 'ms')
  console.log('🧪 - Concurrent:', concurrentTime, 'ms')

  // Diagnosis
  if (authTime > 500) {
    console.log('🚨 PROBLEM: Auth latency muy alta (>500ms)')
    console.log('🔍 Possible causes:')
    console.log('   - Supabase server geográficamente lejano')
    console.log('   - Problemas de conectividad')
    console.log('   - Supabase overloaded')
  }

  if (simpleTime > 200) {
    console.log('🚨 PROBLEM: DB latency muy alta (>200ms)')
    console.log('🔍 Possible causes:')
    console.log('   - Falta de índices en family_members')
    console.log('   - DB server slow')
    console.log('   - Network issues')
  }

  if (complexTime > 500) {
    console.log('🚨 PROBLEM: Complex query muy lenta (>500ms)')
    console.log('🔍 Possible causes:')
    console.log('   - Falta de foreign key indexes')
    console.log('   - JOIN performance issues')
    console.log('   - Table scan instead of index scan')
  }
}

// Hacer disponible globalmente para debug
if (typeof window !== 'undefined') {
  ;(window as any)._testSupabaseLatency = testSupabaseLatency
}