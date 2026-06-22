import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const PLAN_CREDITS_MAP: Record<string, number> = {
  free: 50,
  starter: 500,
  pro: 2000,
  premium: 10000,
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Assinatura ou segredo ausentes.' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error(`Falha na validação do Webhook do Stripe: ${(err as Error).message}`)
    return NextResponse.json({ error: `Webhook Error: ${(err as Error).message}` }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  try {
    switch (event.type) {
      // 1. Ocorre quando a sessão de checkout é concluída com sucesso (primeira compra)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (!userId || !plan) {
          console.error('Metadata de usuário ou plano ausente na checkout session.')
          return NextResponse.json({ error: 'Metadata ausente.' }, { status: 400 })
        }

        const stripeCustomerId = session.customer as string
        const stripeSubscriptionId = session.subscription as string

        // Buscar detalhes da assinatura no Stripe para obter a data de expiração real
        const stripeSub = (await stripe.subscriptions.retrieve(stripeSubscriptionId)) as any
        const periodEnd = new Date(stripeSub.current_period_end * 1000)
        
        const creditsTotal = PLAN_CREDITS_MAP[plan] || 50

        // Atualizar no Supabase usando cliente administrativo (bypassa RLS)
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            plan,
            status: 'active',
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            current_period_end: periodEnd.toISOString(),
            credits_total: creditsTotal,
            credits_remaining: creditsTotal, // Define créditos cheios
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (error) {
          console.error('Erro ao atualizar assinatura no banco de dados:', error.message)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        break
      }

      // 2. Ocorre a cada ciclo de faturamento (renovação mensal)
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const stripeSubscriptionId = invoice.subscription as string

        if (!stripeSubscriptionId) {
          // Pode ser um pagamento único de fatura avulsa
          break
        }

        // Obter detalhes da assinatura no Stripe
        const stripeSub = (await stripe.subscriptions.retrieve(stripeSubscriptionId)) as any
        const plan = stripeSub.metadata?.plan || stripeSub.items.data[0]?.price?.metadata?.plan
        const userId = stripeSub.metadata?.userId

        if (!userId || !plan) {
          console.error('UserId ou Plan não encontrado nos metadados da assinatura no Stripe.')
          break
        }

        const periodEnd = new Date(stripeSub.current_period_end * 1000)
        const creditsTotal = PLAN_CREDITS_MAP[plan] || 50

        // Buscar créditos atuais para verificar regra de acúmulo
        const { data: currentSub } = await supabaseAdmin
          .from('subscriptions')
          .select('credits_remaining, plan')
          .eq('user_id', userId)
          .single()

        let newCreditsRemaining = creditsTotal

        // Regra de negócio: Créditos acumulam apenas no plano Premium
        if (currentSub && currentSub.plan === 'premium' && plan === 'premium') {
          newCreditsRemaining = currentSub.credits_remaining + creditsTotal
        }

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_end: periodEnd.toISOString(),
            credits_total: creditsTotal,
            credits_remaining: newCreditsRemaining,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (error) {
          console.error('Erro ao processar renovação de assinatura no banco:', error.message)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        break
      }

      // 3. Ocorre quando a assinatura é cancelada ou expira por falta de pagamento
      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as any
        const userId = stripeSub.metadata?.userId

        if (!userId) {
          console.error('UserId ausente na deleção de assinatura.')
          break
        }

        // Rebaixar usuário para o plano gratuito (Free)
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'active', // Plano grátis está sempre ativo
            stripe_subscription_id: null,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias adicionais
            credits_total: 50,
            credits_remaining: 50, // Reseta para os 50 créditos gratuitos
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (error) {
          console.error('Erro ao rebaixar usuário para o plano Free:', error.message)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        break
      }

      default:
        // Outros eventos do Stripe não mapeados
        break
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Erro ao processar webhook do Stripe:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao processar webhook.' },
      { status: 500 }
    )
  }
}
