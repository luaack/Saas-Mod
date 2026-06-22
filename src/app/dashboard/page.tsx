'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Download, Copy, RefreshCw, AlertCircle, Image as ImageIcon, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MODELS = [
  { id: 'bfl:5@1', name: 'Flux Pro (Alta Qualidade)', costDescription: '5 créditos' },
  { id: 'stability:sdxl', name: 'SDXL (Rápido & Econômico)', costDescription: '2 créditos' },
]

const RATIOS = [
  { id: '512x512', name: 'Quadrado (512x512)', width: 512, height: 512, cost: 2, label: 'Standard' },
  { id: '1024x1024', name: 'Quadrado HD (1024x1024)', width: 1024, height: 1024, cost: 5, label: 'HD' },
  { id: '1024x576', name: 'Paisagem HD (1024x576)', width: 1024, height: 576, cost: 5, label: 'HD Landscape' },
  { id: '576x1024', name: 'Retrato HD (576x1024)', width: 576, height: 1024, cost: 5, label: 'HD Portrait' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(MODELS[0].id)
  const [ratioId, setRatioId] = useState(RATIOS[0].id)
  
  const [error, setError] = useState<string | null>(null)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const activeRatio = RATIOS.find(r => r.id === ratioId) || RATIOS[0]
  
  // Calcular crédito dinâmico baseado na seleção
  const selectedModelCost = model === 'bfl:5@1' ? 5 : 2
  const selectedRatioCost = activeRatio.cost
  // Para Flux Pro é sempre 5 créditos, para SDXL varia dependendo da dimensão
  const finalCost = model === 'bfl:5@1' ? 5 : selectedRatioCost

  const handleGenerate = () => {
    if (!prompt.trim()) {
      setError('Por favor, descreva a imagem que deseja gerar.')
      return
    }

    setError(null)
    setGeneratedUrl(null)

    startTransition(async () => {
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'image',
            prompt,
            model,
            width: activeRatio.width,
            height: activeRatio.height,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Ocorreu um erro ao processar a geração de imagem.')
          return
        }

        setGeneratedUrl(data.url)
        // Recarregar os dados do servidor para atualizar o saldo de créditos na barra lateral
        router.refresh()
      } catch (err) {
        setError('Erro de rede. Verifique sua conexão e tente novamente.')
      }
    })
  }

  const handleCopyLink = async () => {
    if (!generatedUrl) return
    try {
      await navigator.clipboard.writeText(generatedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Falha ao copiar link:', err)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-500 bg-clip-text text-transparent">
          Gerador de Imagens IA
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Escreva um prompt detalhado e deixe a inteligência artificial dar vida à sua imaginação.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulário de Input à Esquerda */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardContent className="p-6 space-y-6">
              
              {/* Prompt Textarea */}
              <div className="space-y-2">
                <Label htmlFor="prompt-input" className="text-sm font-semibold">Descrição da imagem (Prompt)</Label>
                <textarea
                  id="prompt-input"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Um gato cibernético com olhos de neon brilhando, sentado em um arranha-céu com a cidade de Tóquio futurista ao fundo, estilo cyberpunk, hiper-detalhado..."
                  className="w-full rounded-lg bg-background/50 border border-border/50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none placeholder-muted-foreground"
                />
              </div>

              {/* Modelo de Seleção */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Modelo de IA</Label>
                <div className="grid grid-cols-1 gap-2">
                  {MODELS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setModel(item.id)}
                      className={`flex flex-col text-left p-3 rounded-lg border text-sm transition-all ${
                        model === item.id
                          ? 'border-primary bg-primary/10 text-primary-foreground'
                          : 'border-border/50 bg-background/30 hover:bg-neutral-800/20 text-neutral-300'
                      }`}
                    >
                      <span className="font-semibold text-white">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        Consome {item.id === 'bfl:5@1' ? '5' : '2'} créditos por geração
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Proporção da imagem (Aspect Ratio) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Proporção e Resolução</Label>
                <div className="grid grid-cols-2 gap-2">
                  {RATIOS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRatioId(item.id)}
                      className={`flex flex-col p-3 rounded-lg border text-left text-xs transition-all ${
                        ratioId === item.id
                          ? 'border-primary bg-primary/10 text-primary-foreground'
                          : 'border-border/50 bg-background/30 hover:bg-neutral-800/20 text-neutral-300'
                      }`}
                    >
                      <span className="font-semibold text-white">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {item.width}x{item.height} ({item.cost} cr.)
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botão de Ação */}
              <Button
                onClick={handleGenerate}
                disabled={isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/95 transition-all text-sm font-semibold py-6"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Gerando imagem (Runware)...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Imagem ({finalCost} créditos)
                  </>
                )}
              </Button>

            </CardContent>
          </Card>
        </div>

        {/* Visualização do Resultado à Direita */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full min-h-[450px]">
          <Card className="flex-1 border-border/40 bg-card/25 backdrop-blur-md flex flex-col justify-center items-center p-6 relative overflow-hidden">
            {/* Background glowing gradients */}
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,var(--primary-foreground)/0.03,transparent_60%)] pointer-events-none" />

            {isPending ? (
              <div className="flex flex-col items-center gap-4 text-center z-10">
                <div className="p-4 rounded-full bg-neutral-900 border border-border/40 animate-pulse">
                  <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">Criando obra de arte...</h3>
                  <p className="text-xs text-muted-foreground max-w-[280px]">
                    Processando prompt na Runware API. Isso costuma levar menos de 5 segundos.
                  </p>
                </div>
              </div>
            ) : generatedUrl ? (
              <div className="w-full h-full flex flex-col justify-between gap-6 z-10">
                {/* Imagem Gerada */}
                <div className="flex-1 flex justify-center items-center overflow-hidden rounded-xl bg-neutral-950 border border-border/20 shadow-xl max-h-[500px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generatedUrl}
                    alt={prompt}
                    className="max-w-full max-h-full object-contain rounded-xl"
                  />
                </div>

                {/* Ações da imagem */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="border-border/50 bg-background/50 hover:bg-neutral-800/40 text-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-3.5 w-3.5 text-green-500" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        Copiar Link
                      </>
                    )}
                  </Button>

                  <a
                    href={generatedUrl}
                    download={`auragen-${Date.now()}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border/50 bg-background/50 hover:bg-neutral-800/40 text-xs"
                    >
                      <Download className="mr-2 h-3.5 w-3.5" />
                      Baixar Imagem
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center text-muted-foreground py-16">
                <div className="p-4 rounded-2xl bg-neutral-900 border border-border/20">
                  <ImageIcon className="h-10 w-10 text-neutral-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-neutral-300">Nenhuma imagem gerada</h3>
                  <p className="text-xs max-w-[280px]">
                    Preencha o prompt à esquerda e clique em gerar para iniciar o processo.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}
