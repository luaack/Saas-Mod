import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Coins, ShieldCheck, Sparkles, AlertTriangle, ArrowUpRight, HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function CreditsPage() {
  const supabase = await createClient()

  // 1. Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Buscar assinatura
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // 3. Buscar últimas 5 gerações para detalhar consumo
  const { data: recentGenerations } = await supabase
    .from('generations')
    .select('id, type, prompt, credits_used, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const planName = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : 'Free'
  const creditsRemaining = subscription?.credits_remaining ?? 0
  const creditsTotal = subscription?.credits_total ?? 0
  const isFreePlan = subscription?.plan === 'free'

  const nextResetDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A'

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-500 bg-clip-text text-transparent">
          Gestão de Créditos & Plano
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe seu saldo de créditos, histórico de consumo e gerencie sua assinatura.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Painel Principal de Créditos */}
        <Card className="md:col-span-2 border-border/40 bg-card/30 backdrop-blur-md flex flex-col justify-between">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary animate-pulse" />
                  Saldo Disponível
                </CardTitle>
                <CardDescription>
                  Seu plano atual é o <span className="font-semibold text-white">{planName}</span>
                </CardDescription>
              </div>
              
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                isFreePlan 
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-400' 
                  : 'bg-primary/20 border-primary/30 text-primary'
              }`}>
                {subscription?.status === 'active' ? 'Ativo' : 'Pendente'}
              </span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">{creditsRemaining}</span>
              <span className="text-muted-foreground text-sm">/ {creditsTotal} créditos restantes</span>
            </div>
            
            <div className="space-y-2">
              <div className="w-full bg-neutral-900 h-3 rounded-full overflow-hidden border border-border/10">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${creditsTotal > 0 ? (creditsRemaining / creditsTotal) * 100 : 0}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Consumo: {creditsTotal - creditsRemaining} créditos</span>
                <span>{creditsRemaining} disponíveis</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border/10 p-6 bg-neutral-900/10 flex flex-wrap justify-between items-center gap-4">
            <div className="text-xs text-muted-foreground">
              {isFreePlan 
                ? 'Os créditos gratuitos expiram e renovam a cada 30 dias.'
                : `Seu ciclo de faturamento renova em ${nextResetDate}.`
              }
            </div>

            {isFreePlan ? (
              <Link href="/planos">
                <Button className="bg-primary text-primary-foreground text-xs">
                  Fazer Upgrade
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <a href="/api/create-portal-session">
                <Button variant="outline" className="border-border/50 bg-background/50 hover:bg-neutral-800/40 text-xs">
                  Gerenciar Assinatura (Stripe)
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </a>
            )}
          </CardFooter>
        </Card>

        {/* Tabela de Custos */}
        <Card className="border-border/40 bg-card/25 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              Custo de Geração
            </CardTitle>
            <CardDescription>
              Consumo por tipo de conteúdo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/20 text-xs px-6 pb-6">
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground">Imagem Standard (512x512)</span>
                <span className="font-semibold text-white">2 créditos</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground">Imagem HD (1024x1024)</span>
                <span className="font-semibold text-white">5 créditos</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground">Vídeo curto (até 5s)</span>
                <span className="font-semibold text-white text-muted-foreground/60">30 créditos</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground">Áudio curto (até 30s)</span>
                <span className="font-semibold text-white text-muted-foreground/60">10 créditos</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground">Texto / LLM (1k tokens)</span>
                <span className="font-semibold text-white text-muted-foreground/60">1 crédito</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico Recente de Transações */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Consumo Recente</h2>
        
        {!recentGenerations || recentGenerations.length === 0 ? (
          <Card className="border-border/40 bg-card/20 py-8 text-center text-xs text-muted-foreground">
            Nenhuma geração de créditos registrada recentemente.
          </Card>
        ) : (
          <Card className="border-border/40 bg-card/20 backdrop-blur-md overflow-hidden">
            <div className="divide-y divide-border/10 text-xs">
              {recentGenerations.map((item) => {
                const date = new Date(item.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                
                return (
                  <div key={item.id} className="flex justify-between items-center p-4 hover:bg-neutral-800/10 transition-colors">
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
                        <span className="capitalize">{item.type}</span>
                        <span className="text-neutral-500 font-normal">({date})</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate max-w-lg">
                        {item.prompt}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 font-bold text-primary shrink-0">
                      <span>-{item.credits_used}</span>
                      <span className="text-[10px] text-neutral-500 font-semibold">cr.</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
