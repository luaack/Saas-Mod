import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Em caso de falha na autenticação via OAuth, retorna para o login com mensagem de erro
  return NextResponse.redirect(`${origin}/login?error=Ocorreu%20um%20erro%20durante%20a%20autentica%C3%A7%C3%A3o.`)
}
