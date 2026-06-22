import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendRunwareTasks, RunwareTask } from '@/lib/runware'

// Tabela de custo em créditos baseada no tipo e tamanho
function calculateCredits(type: string, width?: number, height?: number): number {
  if (type === 'image') {
    const w = width || 512
    const h = height || 512
    // Se for menor ou igual a 512x512
    if (w <= 512 && h <= 512) {
      return 2
    }
    return 5
  }
  if (type === 'video') return 30
  if (type === 'audio') return 10
  if (type === 'text') return 1
  return 2
}

// Helper para fazer download da imagem temporária da Runware e subir no Supabase Storage
async function uploadToSupabaseStorage(
  supabaseClient: any,
  imageUrl: string,
  userId: string,
  type: string
): Promise<string> {
  try {
    const fetchResponse = await fetch(imageUrl)
    if (!fetchResponse.ok) {
      throw new Error(`Falha ao baixar imagem da Runware: ${fetchResponse.statusText}`)
    }
    
    const blob = await fetchResponse.blob()
    const contentType = blob.type || 'image/png'
    
    // Obter extensão baseado no content-type
    let extension = 'png'
    if (contentType.includes('jpeg')) extension = 'jpg'
    else if (contentType.includes('webp')) extension = 'webp'
    else if (contentType.includes('mp4')) extension = 'mp4'
    else if (contentType.includes('mpeg') || contentType.includes('mp3')) extension = 'mp3'

    const fileName = `${userId}/${type}-${Date.now()}.${extension}`

    // Fazer upload para o bucket 'generations'
    // O bucket 'generations' precisa estar criado e configurado como público no Supabase Storage.
    const { data, error } = await supabaseClient.storage
      .from('generations')
      .upload(fileName, blob, {
        contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Erro de upload no Storage do Supabase:', error.message)
      // Se der erro no storage, retornamos a URL da Runware como fallback
      return imageUrl
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabaseClient.storage
      .from('generations')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (err) {
    console.error('Falha no proxy do arquivo para o Supabase Storage:', err)
    return imageUrl // Fallback
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verificar autenticação do usuário
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // 2. Extrair dados da requisição
    const body = await request.json()
    const { type, prompt, model, width, height, ...rest } = body

    if (!type || !prompt || !model) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios ausentes: type, prompt, model.' },
        { status: 400 }
      )
    }

    // 3. Validar se o plano permite a modalidade escolhida
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan, credits_remaining, status')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Não foi possível encontrar a assinatura do usuário.' },
        { status: 400 }
      )
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Sua assinatura não está ativa. Efetue um pagamento para continuar.' },
        { status: 400 }
      )
    }

    // Validação de limitações do plano Free
    if (subscription.plan === 'free') {
      if (type !== 'image') {
        return NextResponse.json(
          { error: 'O plano gratuito suporta apenas geração de imagens.' },
          { status: 403 }
        )
      }
      
      // Checar rate limit do dia para o plano Free (máximo 10 gerações por dia)
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      
      const { count, error: countError } = await supabase
        .from('generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())

      if (!countError && count !== null && count >= 10) {
        return NextResponse.json(
          { error: 'Limite diário de 10 gerações atingido para o plano gratuito.' },
          { status: 429 }
        )
      }
    }

    // Validação de limites por plano adicionais
    if (subscription.plan === 'starter' && (type === 'video' || type === 'audio')) {
      return NextResponse.json(
        { error: 'Seu plano Starter não suporta geração de vídeo/áudio. Faça um upgrade.' },
        { status: 403 }
      )
    }

    // 4. Calcular e verificar se há créditos suficientes
    const creditsRequired = calculateCredits(type, width, height)
    if (subscription.credits_remaining < creditsRequired) {
      return NextResponse.json(
        { error: `Créditos insuficientes. Esta geração requer ${creditsRequired} créditos, mas você possui apenas ${subscription.credits_remaining}.` },
        { status: 400 }
      )
    }

    // 5. Deduzir créditos no banco de dados de forma atômica
    const { data: deductSuccess, error: deductError } = await supabase.rpc(
      'deduct_credits',
      {
        p_user_id: user.id,
        p_amount: creditsRequired
      }
    )

    if (deductError || !deductSuccess) {
      return NextResponse.json(
        { error: 'Falha ao debitar créditos. Tente novamente.' },
        { status: 500 }
      )
    }

    // 6. Configurar tarefa da Runware de acordo com o tipo
    let task: RunwareTask
    if (type === 'image') {
      task = {
        taskType: 'imageInference',
        model: model,
        positivePrompt: prompt,
        width: width || 512,
        height: height || 512,
        ...rest
      }
    } else {
      // Outras modalidades (futuras)
      task = {
        taskType: type === 'video' ? 'videoInference' : type === 'audio' ? 'audioInference' : 'textInference',
        model: model,
        prompt: prompt,
        ...rest
      }
    }

    // 7. Chamar API da Runware
    let runwareResponse
    try {
      runwareResponse = await sendRunwareTasks([task])
    } catch (runwareErr) {
      console.error('Erro na chamada da Runware:', runwareErr)
      
      // Estornar créditos em caso de falha da Runware API
      // Usaremos o cliente admin para devolver os créditos (soma)
      const adminSupabase = await createClient() // O próprio usuário pode atualizar se tiver permissão, ou usamos admin
      await adminSupabase
        .from('subscriptions')
        .update({ credits_remaining: subscription.credits_remaining }) // Restaura o saldo original
        .eq('user_id', user.id)

      return NextResponse.json(
        { error: `Erro ao comunicar com o provedor de IA: ${(runwareErr as Error).message}` },
        { status: 502 }
      )
    }

    const taskResult = runwareResponse.results[0]
    if (!taskResult || taskResult.status === 'failed' || (!taskResult.imageURL && !taskResult.videoURL && !taskResult.audioURL && !taskResult.text)) {
      // Estorna em caso de falha de processamento
      await supabase
        .from('subscriptions')
        .update({ credits_remaining: subscription.credits_remaining })
        .eq('user_id', user.id)

      return NextResponse.json(
        { error: 'A geração de IA falhou no processador da Runware.' },
        { status: 502 }
      )
    }

    // Obter URL temporária retornada
    const tempUrl = taskResult.imageURL || taskResult.videoURL || taskResult.audioURL || taskResult.text || ''
    
    // 8. Fazer upload para o Storage do Supabase (proxy) se for arquivo
    let finalUrl = tempUrl
    if (type !== 'text' && tempUrl.startsWith('http')) {
      finalUrl = await uploadToSupabaseStorage(supabase, tempUrl, user.id, type)
    }

    // 9. Salvar registro da geração no histórico do banco de dados
    const { data: generation, error: genError } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        type,
        prompt,
        model,
        output_url: finalUrl,
        credits_used: creditsRequired,
        metadata: {
          width,
          height,
          runware_task_id: taskResult.taskUUID || '',
          ...rest
        }
      })
      .select()
      .single()

    if (genError) {
      console.error('Erro ao salvar no histórico de gerações:', genError.message)
      // Retornamos a URL mesmo se falhar ao salvar no histórico
    }

    return NextResponse.json({
      success: true,
      credits_used: creditsRequired,
      credits_remaining: subscription.credits_remaining - creditsRequired,
      url: finalUrl,
      generation
    })

  } catch (error) {
    console.error('Erro inesperado no endpoint /api/generate:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}
