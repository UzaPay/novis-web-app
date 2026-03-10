import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, ArrowRight, Lock, ShieldCheck, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/lib/auth'
import { toast } from 'sonner'
import { BrandLogo } from '@/components/BrandLogo'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authService.login(username, password)
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(120deg,#ecfeff_0%,#e0f2fe_35%,#eff6ff_70%,#fef9c3_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-[24rem] w-[24rem] rounded-full bg-cyan-300/40 blur-3xl" />
        <div className="absolute right-[-4rem] top-16 h-[30rem] w-[30rem] rounded-full bg-blue-300/35 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-indigo-200/60 blur-3xl" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <div className="relative grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="min-h-screen"
        >
          <Card className="h-full w-full rounded-none border-0 bg-white/72 backdrop-blur-xl">
            <CardContent className="flex h-full flex-col justify-between p-8 sm:p-12 lg:p-14">
              <div>
                <BrandLogo showText={false} logoClassName="h-20 w-auto sm:h-24" />
                <p className="mt-10 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Lending Intelligence Platform
                </p>
                <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Make faster credit decisions with clearer portfolio insight.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-700 sm:text-lg">
                  Run lending operations with confidence. Monitor customer health, risk signals, and portfolio trends from one secure workspace.
                </p>
              </div>

              <div className="mt-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                    <ShieldCheck className="mb-3 h-5 w-5 text-sky-600" />
                    <p className="text-sm font-semibold text-slate-900">Safer decisions</p>
                    <p className="mt-1 text-xs text-slate-600">Risk cues surfaced before delinquency grows.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                    <Activity className="mb-3 h-5 w-5 text-sky-600" />
                    <p className="text-sm font-semibold text-slate-900">Real-time portfolio pulse</p>
                    <p className="mt-1 text-xs text-slate-600">Performance changes visible at a glance.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                    <Sparkles className="mb-3 h-5 w-5 text-sky-600" />
                    <p className="text-sm font-semibold text-slate-900">Sharper workflows</p>
                    <p className="mt-1 text-xs text-slate-600">Consolidated tools for teams and analysts.</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-sky-200/70 bg-sky-50/70 px-5 py-4">
                  <p className="text-sm font-medium text-slate-800">
                    One secure platform for dashboard intelligence, customer context, and loan-level detail.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="min-h-screen"
        >
          <Card className="h-full w-full rounded-none border-0 bg-white/92 backdrop-blur-md">
            <CardContent className="flex h-full items-center justify-center p-8 sm:p-10">
              <div className="w-full max-w-md">
                <CardHeader className="space-y-3 px-0 pb-5 pt-0">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 ring-1 ring-sky-100">
                    <Lock className="h-6 w-6 text-sky-600" />
                  </div>
                  <div className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                      Welcome back
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600">
                      Sign in to continue to your Novis Pilot workspace.
                    </CardDescription>
                  </div>
                </CardHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-700">
                      Username
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="h-11 border-slate-200 bg-white pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 border-slate-200 bg-white pl-9"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="mt-2 h-11 w-full gap-2 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                    {!isLoading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
                <p className="mt-4 text-center text-xs text-slate-500">
                  Secured access for authorized Novis Pilot users.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  )
}
