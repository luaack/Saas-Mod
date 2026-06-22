import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Sparkles, History, Coins, CreditCard, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Validar usuário autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Buscar assinatura e saldo de créditos
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, credits_remaining, credits_total')
    .eq('user_id', user.id)
    .single()

  const planName = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : 'Free'
  const creditsRemaining = subscription?.credits_remaining ?? 0
  const creditsTotal = subscription?.credits_total ?? 0

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border/40 bg-card/40 backdrop-blur-md">
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* Logo */}
          <div className="flex items-center h-16 px-6 gap-2 border-b border-border/40">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              AuraGen
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-neutral-300 hover:bg-neutral-800/40 hover:text-white transition-all group"
            >
              <Sparkles className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-primary transition-colors" />
              Geração de IA
            </Link>

            <Link
              href="/dashboard/history"
              className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-neutral-300 hover:bg-neutral-800/40 hover:text-white transition-all group"
            >
              <History className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-primary transition-colors" />
              Histórico
            </Link>

            <Link
              href="/dashboard/credits"
              className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-neutral-300 hover:bg-neutral-800/40 hover:text-white transition-all group"
            >
              <Coins className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-primary transition-colors" />
              Créditos
            </Link>

            <Link
              href="/planos"
              className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-neutral-300 hover:bg-neutral-800/40 hover:text-white transition-all group"
            >
              <CreditCard className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-primary transition-colors" />
              Planos & Preços
            </Link>
          </nav>

          {/* User profile / credits stats */}
          <div className="p-4 border-t border-border/40 space-y-4">
            <div className="px-4 py-3 rounded-xl bg-neutral-900/50 border border-border/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Plano {planName}</span>
                <span className="font-semibold text-primary">{creditsRemaining} / {creditsTotal}</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${creditsTotal > 0 ? (creditsRemaining / creditsTotal) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Créditos resetam mensalmente
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center border border-border/40 text-neutral-300">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-neutral-200 truncate">
                    {user.user_metadata?.full_name || 'Usuário Aura'}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </div>
              
              <form action={logout}>
                <Button
                  variant="ghost"
                  size="icon"
                  type="submit"
                  className="h-8 w-8 text-neutral-400 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:pl-64 h-full">
        {/* Header - Mobile */}
        <header className="flex md:hidden items-center justify-between h-16 px-6 border-b border-border/40 bg-card/40 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold text-base text-neutral-200">AuraGen</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-xs px-2 py-1 rounded bg-neutral-900 border border-border/30 text-neutral-300">
              <span className="font-semibold text-primary">{creditsRemaining}</span> créditos
            </div>
            
            <form action={logout}>
              <button
                type="submit"
                className="text-neutral-400 hover:text-destructive p-1"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </div>
        </header>

        {/* Mobile Navigation bar */}
        <nav className="flex md:hidden items-center justify-around h-12 bg-neutral-950 border-b border-border/40 text-neutral-400 text-xs">
          <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-neutral-200">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Geração</span>
          </Link>
          <Link href="/dashboard/history" className="flex flex-col items-center gap-0.5">
            <History className="h-4 w-4" />
            <span>Histórico</span>
          </Link>
          <Link href="/dashboard/credits" className="flex flex-col items-center gap-0.5">
            <Coins className="h-4 w-4" />
            <span>Créditos</span>
          </Link>
          <Link href="/planos" className="flex flex-col items-center gap-0.5">
            <CreditCard className="h-4 w-4" />
            <span>Planos</span>
          </Link>
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:p-8 lg:p-10 relative">
          {children}
        </main>
      </div>
    </div>
  )
}
