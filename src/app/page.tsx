import React from 'react'
import Link from 'next/link'
import { Sparkles, Image as ImageIcon, Video, Mic, FileText, ArrowRight, Zap, Heart, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  
  // Buscar se o usuário já está logado
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between pt-20">
      
      {/* Header / Navbar */}
      <header className="header">
        <div className="max-w-6xl mx-auto h-full flex justify-between items-center px-4 md:px-0">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/25 border border-primary/40 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              AuraGen
            </span>
          </Link>

          {/* Links e Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/planos" className="text-xs text-neutral-300 hover:text-white transition-colors">
              Planos & Preços
            </Link>

            {user ? (
              <Link href="/dashboard" className="btn-primary py-2 px-4 text-xs rounded-lg gap-1">
                Acessar Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-xs text-neutral-300 hover:text-white transition-colors">
                  Entrar
                </Link>
                
                <Link href="/register" className="btn-primary py-2 px-4 text-xs rounded-lg">
                  Criar Conta
                </Link>
              </div>
            )}
          </div>

          {/* Links e Actions (Mobile) */}
          <div className="flex md:hidden items-center gap-4">
            <Link href="/planos" className="text-xs text-neutral-300 hover:text-white transition-colors font-medium">
              Planos
            </Link>

            <Link
              href={user ? '/dashboard' : '/login'}
              className="p-1.5 rounded-lg border border-border/40 bg-neutral-900/50 text-neutral-300 hover:text-white transition-colors"
              aria-label="Área do Usuário"
            >
              <User className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col justify-center items-center pt-24 pb-20 px-6 text-center z-10">
        <div className="max-w-3xl space-y-6">
          
          {/* Badge */}
          <div className="badge-highlight">
            <Zap className="h-3.5 w-3.5 text-primary animate-pulse inline mr-1.5 align-middle" />
            <span className="align-middle">Inferência Ultra Rápida com Runware API</span>
          </div>

          <h1 className="hero-title">
            Crie Imagens, Vídeos e Áudios com Inteligência Artificial
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            AuraGen é a plataforma definitiva de geração de conteúdo por IA. Crie imagens de altíssima qualidade, gere narrações, escreva textos e expanda sua criatividade instantaneamente.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2 hero-buttons">
            <Link href={user ? '/dashboard' : '/register'} className="btn-primary">
              Começar Grátis (50 créditos)
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link href="/planos" className="btn-secondary">
              Ver Planos
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

          <div className="cards-grid">
            
            {/* Feature 1 */}
            <div className="card-item group">
              <div className="card-icon-container group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <ImageIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Geração de Imagens</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                Gere imagens com qualidade ultra-realista e fotorrealismo incrível usando os modelos mais potentes (Flux Pro e SDXL).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-item group">
              <div className="card-icon-container group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Criação de Vídeos</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                Transforme prompts em vídeos cinemáticos impressionantes de alta fidelidade com modelos como o Google Veo.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-item group">
              <div className="card-icon-container group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Mic className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Áudios & Narração</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                Gere arquivos de áudio, locuções com timbres perfeitos de voz em múltiplos idiomas em segundos.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card-item group">
              <div className="card-icon-container group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Geração de Texto</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
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
