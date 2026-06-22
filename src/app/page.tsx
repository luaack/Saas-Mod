import React from 'react'
import Link from 'next/link'
import { Sparkles, Image as ImageIcon, Video, Mic, FileText, ArrowRight, Zap, Shield, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function LandingPage() {
  const supabase = await createClient()
  
  // Buscar se o usuário já está logado
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between">
      
      {/* Background gradients */}
      <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[70%] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[70%] rounded-full bg-blue-500/5 blur-[130px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="relative w-full h-20 border-b border-border/40 bg-background/50 backdrop-blur-md z-10">
        <div className="max-w-6xl mx-auto h-full px-6 flex justify-between items-center">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/20 border border-primary/30 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              AuraGen
            </span>
          </Link>

          {/* Links e Actions */}
          <div className="flex items-center gap-6">
            <Link href="/planos" className="text-xs text-neutral-300 hover:text-white transition-colors">
              Planos & Preços
            </Link>

            {user ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold">
                  Acessar Dashboard
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-xs text-neutral-300 hover:text-white transition-colors">
                  Entrar
                </Link>
                
                <Link href="/register">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold">
                    Criar Conta
                  </Button>
                </Link>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col justify-center items-center py-20 px-6 text-center z-10">
        <div className="max-w-3xl space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-border/40 text-[10px] uppercase font-black tracking-widest text-primary">
            <Zap className="h-3 w-3 text-primary animate-pulse" />
            Inferência Ultra Rápida com Runware API
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Crie Imagens, Vídeos e Áudios com{' '}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Inteligência Artificial
            </span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            AuraGen é a plataforma definitiva de geração de conteúdo por IA. Crie imagens de altíssima qualidade, gere narrações, escreva textos e expanda sua criatividade instantaneamente.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href={user ? '/dashboard' : '/register'}>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/95 font-bold px-8">
                Começar Grátis (50 créditos)
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link href="/planos">
              <Button size="lg" variant="outline" className="border-border/50 bg-background/50 hover:bg-neutral-800/40 font-bold px-8">
                Ver Planos
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* Features Grid Section */}
      <section className="relative w-full border-t border-border/40 bg-neutral-950/20 py-20 px-6 z-10">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Recursos de Próxima Geração
            </h2>
            <p className="text-muted-foreground text-xs max-w-md mx-auto">
              Descubra todas as modalidades de criação por inteligência artificial disponíveis em um único lugar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-border/30 bg-card/20 space-y-4 hover:border-primary/30 transition-all duration-300 group">
              <div className="p-3 w-fit rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <ImageIcon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Geração de Imagens</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gere imagens com qualidade ultra-realista e fotorrealismo incrível usando os modelos mais potentes (Flux Pro e SDXL).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-border/30 bg-card/20 space-y-4 hover:border-primary/30 transition-all duration-300 group">
              <div className="p-3 w-fit rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Criação de Vídeos</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Transforme prompts em vídeos cinemáticos impressionantes de alta fidelidade com modelos como o Google Veo.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-border/30 bg-card/20 space-y-4 hover:border-primary/30 transition-all duration-300 group">
              <div className="p-3 w-fit rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                <Mic className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Áudios & Narração</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gere arquivos de áudio, locuções com timbres perfeitos de voz em múltiplos idiomas em segundos.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-border/30 bg-card/20 space-y-4 hover:border-primary/30 transition-all duration-300 group">
              <div className="p-3 w-fit rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Geração de Texto</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Utilize os LLMs mais rápidos para escrever cópias de vendas, responder e-mails, ou criar artigos completos.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative w-full border-t border-border/40 bg-neutral-950 py-10 px-6 z-10 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-white">AuraGen</span>
            <span>- © 2026. Todos os direitos reservados.</span>
          </div>

          <div className="flex items-center gap-1">
            <span>Desenvolvido com</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
            <span>para criativos.</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
