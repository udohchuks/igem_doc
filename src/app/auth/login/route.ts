import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = formData.get('email') as string

  if (!email) {
    return redirect('/login?error=Email is required')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
    },
  })

  if (error) {
    console.error(error)
    return redirect('/login?error=Could not authenticate user')
  }

  return redirect('/login?message=Check your email for the magic link')
}
