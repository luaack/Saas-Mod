import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

// Mapeamento de planos para chaves de preço do Stripe (Price IDs)
const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_dummy_starter',
  pro: process.env.STRIPE_PRICE_PRO || 'price_dummy_pro',
  premium: process.env.STRIPE_PRICE_PREMIUM || 'price_dummy_premium',
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // 2. Extrair plano solicitado
    const body = await request.json()
    const { plan } = body

    if (!plan || !['starter', 'pro', 'premium'].includes(plan)) {
      return NextResponse.json(
        { error: 'Plano inválido ou não informado. Escolha entre: starter, pro, premium.' },
        { status: 400 }
      )
    }

    const priceId = PLAN_PRICE_MAP[plan]
    if (!priceId || priceId.startsWith('price_dummy_')) {
      return NextResponse.json(
        { error: `O Price ID do Stripe para o plano '${plan}' não está configurado nas variáveis de ambiente.` },
        { status: 400 }
      )
    }

    // 3. Buscar se o usuário já tem um stripe_customer_id registrado
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    const stripeCustomerId = subscription?.stripe_customer_id

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 4. Criar Stripe Checkout Session
    const sessionConfig: any = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?payment=success`,
      cancel_url: `${appUrl}/planos?payment=cancel`,
      metadata: {
        userId: user.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: plan,
        },
      },
    }

    // Se já tiver stripe_customer_id, associa a sessão a ele
    if (stripeCustomerId) {
      sessionConfig.customer = stripeCustomerId
    } else {
      // Caso contrário, pré-preenche o email do usuário
      sessionConfig.customer_email = user.email
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao criar sessão de checkout.' },
      { status: 500 }
    )
  }
}
