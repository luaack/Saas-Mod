import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. Buscar o stripe_customer_id do usuário
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription || !subscription.stripe_customer_id) {
      // Se não tiver assinatura paga ou customer_id no Stripe, redireciona para planos
      return NextResponse.redirect(new URL('/planos', request.url))
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 3. Criar sessão do Customer Portal do Stripe
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/dashboard/credits`,
    })

    // 4. Redirecionar o usuário para o portal
    return NextResponse.redirect(session.url)

  } catch (error) {
    console.error('Erro ao criar sessão do portal de faturamento:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/dashboard/credits?error=portal_failed`)
  }
}
