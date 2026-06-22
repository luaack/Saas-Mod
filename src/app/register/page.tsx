'use client'

import React, { useActionState, useTransition } from 'react'
import Link from 'next/link'
import { Sparkles, Loader2 } from 'lucide-react'
import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signup, { error: null, success: false })
  const [isGooglePending, startGoogleTransition] = useTransition()

  const handleGoogleLogin = () => {
    startGoogleTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        console.error('Erro no login social:', error.message)
      }
    })
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* Brand logo/name */}
      <div className="flex items-center gap-2 mb-6 z-10">
        <div className="p-2 rounded-xl bg-primary/25 border border-primary/40 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
          AuraGen
        </span>
      </div>

      <Card className="w-full max-w-md border-border/40 bg-card/60 backdrop-blur-md z-10 shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Criar uma conta</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Insira suas informações abaixo para começar a gerar conteúdo com IA
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-4">
            {state.error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Seu Nome"
                className="bg-background/50 border-border/50 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                required
                className="bg-background/50 border-border/50 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="bg-background/50 border-border/50 focus-visible:ring-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending || isGooglePending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/95 transition-all mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Cadastrar com e-mail'
              )}
            </Button>
          </CardContent>
        </form>

        <div className="relative my-2 px-6">
          <div className="absolute inset-0 flex items-center px-6">
            <span className="w-full border-t border-border/40" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
          </div>
        </div>

        <CardContent className="pt-2">
          <Button
            variant="outline"
            type="button"
            disabled={isPending || isGooglePending}
            onClick={handleGoogleLogin}
            className="w-full border-border/50 hover:bg-muted/50"
          >
            {isGooglePending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
            )}
            Google
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col justify-center gap-2 pt-0 pb-6">
          <div className="text-sm text-center text-muted-foreground">
            Já possui uma conta?{' '}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Entrar
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
