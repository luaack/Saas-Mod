'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Sparkles, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'R$ 0',
    credits: '50 créditos/mês',
    features: [
      'Geração de Imagens apenas',
      'Limite de 10 gerações por dia',
      'Qualidade Standard (512x512)',
      'Acesso ao histórico de 7 dias',
    ],
    buttonText: 'Plano Atual',
    popular: false,
    disabled: true,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 29',
    credits: '500 créditos/mês',
    features: [
      'Geração de Imagens + Texto',
      'Gerações HD (1024x1024)',
      'Sem limite diário de gerações',
      'Histórico completo vitalício',
      'Suporte padrão via e-mail',
    ],
    buttonText: 'Assinar Starter',
    popular: false,
    disabled: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 79',
    credits: '2.000 créditos/mês',
    features: [
      'Imagens, Vídeos, Áudios e Texto',
      'Gerações HD e velocidade prioritária',
      'Sem limite diário',
      'Histórico completo vitalício',
      'Suporte prioritário 24/7',
    ],
    buttonText: 'Assinar Pro',
    popular: true,
    disabled: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 199',
    credits: '10.000 créditos/mês',
    features: [
      'Acesso total a todas as modalidades',
      'Créditos não consumidos acumulam!',
      'Suporte VIP via WhatsApp/Slack',
      'Acesso antecipado a novos modelos',
      'Chave API própria para devs',
    ],
    buttonText: 'Assinar Premium',
    popular: false,
    disabled: false,
  },
]

export default function PlanosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [activePlanId, setActivePlanId] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Buscar plano atual
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_id', user.id)
          .single()
        
        setCurrentPlan(sub?.plan || 'free')
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  const handleSubscribe = (planId: string) => {
    if (!user) {
      // Se não estiver logado, redireciona para criar conta
      router.push(`/register?redirect=/planos`)
      return
    }

    setActivePlanId(planId)
    startTransition(async () => {
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan: planId }),
        })

        const data = await response.json()

        if (!response.ok) {
          alert(data.error || 'Falha ao processar checkout.')
          return
        }

        // Redireciona para o checkout do Stripe
        if (data.url) {
          window.location.href = data.url
        }
      } catch (err) {
        alert('Erro ao tentar conectar ao gateway de pagamento.')
      }
    })
  }

  return (
    <div className="relative min-h-screen bg-background py-16 px-4 md:px-8 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        
        {/* Header navigation back */}
        <div className="flex justify-between items-center">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center text-xs text-muted-foreground hover:text-white transition-colors group">
            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
            Voltar ao {user ? 'Dashboard' : 'Início'}
          </Link>

          {!user && !loading && (
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-border/50 bg-background/50 hover:bg-neutral-800/40 text-xs">
                Entrar / Cadastrar
              </Button>
            </Link>
          )}
        </div>

        {/* Title Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-500 bg-clip-text text-transparent sm:text-5xl">
            Escolha o plano ideal para suas ideias
          </h1>
          <p className="text-muted-foreground text-sm">
            Selecione o plano ideal de créditos recorrentes mensais. Altere de plano ou cancele sua assinatura a qualquer momento de forma simples.
          </p>
        </div>

        {/* Grid de planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const showButtonLoader = isPending && activePlanId === plan.id

            return (
              <Card
                key={plan.id}
                className={`border-border/40 bg-card/40 backdrop-blur-md flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                  plan.popular ? 'border-primary/50 ring-1 ring-primary/30 shadow-primary/10 shadow-2xl scale-[1.02]' : 'hover:border-neutral-700'
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}

                <CardHeader className="space-y-1">
                  <CardTitle className="text-lg text-white">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1 py-2">
                    <span className="text-3xl font-black text-white">{plan.price}</span>
                    <span className="text-muted-foreground text-xs font-semibold">/mês</span>
                  </div>
                  <CardDescription className="text-primary font-semibold text-xs flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {plan.credits}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <div className="w-full h-px bg-border/20" />
                  <ul className="space-y-2.5 text-xs text-neutral-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-6">
                  {isCurrent ? (
                    <Button disabled className="w-full bg-neutral-900 border border-neutral-800 text-neutral-400">
                      Plano Atual
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={plan.disabled || showButtonLoader}
                      variant={plan.popular ? 'default' : 'outline'}
                      className={`w-full text-xs font-semibold transition-all ${
                        plan.popular
                          ? 'bg-primary text-primary-foreground hover:bg-primary/95'
                          : 'border-border/50 bg-background/50 hover:bg-neutral-800/40'
                      }`}
                    >
                      {showButtonLoader ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Redirecionando...
                        </>
                      ) : (
                        plan.buttonText
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-muted-foreground mt-4">
          Pagamentos seguros processados pelo Stripe. Créditos resetados no início de cada ciclo mensal.
        </p>

      </div>
    </div>
  )
}
