'use client'

import { useState, useTransition } from 'react'
import { BookOpen, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [touched, setTouched] = useState({ email: false, password: false })
  const [passwordVal, setPasswordVal] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    startTransition(() => {
      const action = isSignUp ? '/auth/signup' : '/auth/login'
      fetch(action, {
        method: 'POST',
        body: formData,
      }).then((res) => {
        if (res.redirected) {
          window.location.href = res.url
        } else {
          setError('Something went wrong. Please try again.')
        }
      })
    })
  }

  const passwordChecks = isSignUp ? [
    { label: 'At least 6 characters', pass: (v: string) => v.length >= 6 },
    { label: 'Contains a number', pass: (v: string) => /\d/.test(v) },
    { label: 'Contains a letter', pass: (v: string) => /[a-zA-Z]/.test(v) },
  ] : []

  return (
    <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center px-4">
      <div className="w-full max-w-[360px] sm:max-w-sm">
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg shadow-emerald-500/20">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-[#0a0e14]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Scholarly</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1.5 sm:mt-2">iGEM 2026 Team Access</p>
        </div>

        <div className="flex bg-white/[0.05] rounded-xl p-1 mb-5 sm:mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError('') }}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${!isSignUp ? 'bg-emerald-500 text-[#0a0e14] shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError('') }}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${isSignUp ? 'bg-emerald-500 text-[#0a0e14] shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          <div>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
              autoComplete="email"
              onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 sm:py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition text-sm"
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={passwordVal}
              onChange={e => setPasswordVal(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 sm:py-3.5 pr-11 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>

          {isSignUp && touched.password && (
            <div className="space-y-1.5 text-xs">
              {passwordChecks.map(check => {
                const pass = check.pass(passwordVal)
                return (
                  <div key={check.label} className={`flex items-center gap-1.5 transition ${pass ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {pass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {check.label}
                  </div>
                )
              })}
            </div>
          )}

          {error && (
            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 transition-opacity duration-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0e14] font-semibold py-3 sm:py-3.5 rounded-xl transition text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs sm:text-sm mt-6 sm:mt-8">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setTouched({ email: false, password: false }) }}
            className="text-emerald-400 hover:text-emerald-300 transition font-medium"
          >
            {isSignUp ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  )
}
