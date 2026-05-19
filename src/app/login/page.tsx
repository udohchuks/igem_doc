import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  // If already logged in, go to workspaces
  if (data?.user) {
    redirect('/workspaces')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-900">Sign in to Scholarly</h1>
        <p className="text-gray-600 text-center mb-6">Enter your email to receive a magic link.</p>
        
        <form action="/auth/login" method="post" className="flex flex-col gap-4">
          <input 
            type="email" 
            name="email" 
            placeholder="you@example.com" 
            required 
            className="border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <button 
            type="submit"
            className="bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Send Magic Link
          </button>
        </form>
      </div>
    </div>
  )
}
