import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function WorkspacesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b">
        <h1 className="text-xl font-bold text-gray-900">Scholarly</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-red-600 hover:underline">Sign out</button>
          </form>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {children}
      </main>
    </div>
  )
}
