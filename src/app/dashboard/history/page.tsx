import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Sparkles, Download, ExternalLink, Calendar, Cpu, Coins } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = await createClient()

  // 1. Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Buscar histórico do usuário
  const { data: generations, error } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-500 bg-clip-text text-transparent">
            Seu Histórico de Gerações
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Reveja, faça download ou recupere todas as suas gerações passadas.
          </p>
        </div>
        
        {generations && generations.length > 0 && (
          <Link href="/dashboard">
            <Button size="sm" className="bg-primary text-primary-foreground">
              <Sparkles className="mr-2 h-4 w-4" />
              Nova Geração
            </Button>
          </Link>
        )}
      </div>

      {!generations || generations.length === 0 ? (
        <Card className="border-border/40 bg-card/25 backdrop-blur-md py-16 flex flex-col justify-center items-center text-center">
          <CardContent className="space-y-4">
            <div className="p-4 rounded-full bg-neutral-900 border border-border/40 w-16 h-16 flex items-center justify-center text-neutral-600">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Nenhum conteúdo gerado ainda</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Sua galeria está vazia. Comece a gerar incríveis imagens com IA usando seus créditos iniciais.
              </p>
            </div>
            <Link href="/dashboard" className="inline-block mt-2">
              <Button className="bg-primary text-primary-foreground">
                Criar Primeira Imagem
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {generations.map((item) => {
            const formattedDate = new Date(item.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })
            
            return (
              <Card key={item.id} className="border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden flex flex-col justify-between group hover:border-primary/40 transition-all duration-300">
                
                {/* Media Container */}
                <div className="relative aspect-square w-full overflow-hidden bg-neutral-950 border-b border-border/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.output_url}
                    alt={item.prompt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Floating badge for type */}
                  <span className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur-md text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded text-neutral-300 border border-border/30">
                    {item.type}
                  </span>
                </div>

                {/* Metadata Content */}
                <CardHeader className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formattedDate}</span>
                    <span className="text-border/80">•</span>
                    <Cpu className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">{item.model}</span>
                  </div>

                  <p className="text-xs text-neutral-200 line-clamp-3 font-medium min-h-[48px]" title={item.prompt}>
                    {item.prompt}
                  </p>
                </CardHeader>

                <CardFooter className="p-4 pt-0 border-t border-border/10 flex justify-between items-center bg-neutral-900/20">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                    <Coins className="h-3.5 w-3.5 text-primary" />
                    <span>{item.credits_used} cr.</span>
                  </div>

                  <div className="flex gap-1.5">
                    <a
                      href={item.output_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-border/40 bg-background/50 hover:bg-neutral-800/60 text-neutral-300 transition-colors"
                      title="Ver original"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    
                    <a
                      href={item.output_url}
                      download={`auragen-history-${item.id}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-border/40 bg-background/50 hover:bg-neutral-800/60 text-neutral-300 transition-colors"
                      title="Fazer download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </CardFooter>

              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
