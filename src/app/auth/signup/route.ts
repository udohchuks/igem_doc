import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return redirect('/login?error=Email and password are required')
  }

  if (password.length < 6) {
    return redirect('/login?error=Password must be at least 6 characters')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error(error)
    if (error.message.includes('already registered')) {
      return redirect('/login?error=An account with this email already exists. Please sign in.')
    }
    return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // Auto sign in after successful signup
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return redirect('/login?error=Account created but sign in failed. Please try signing in.')
  }

  return redirect('/workspaces')
}
