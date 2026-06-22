import { v4 as uuidv4 } from 'uuid'

export interface RunwareTask {
  taskType: string
  taskUUID?: string
  model: string
  [key: string]: any
}

// Configurações e retry helper
const RUNWARE_ENDPOINT = 'https://api.runware.ai/v1'

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  try {
    const res = await fetch(url, options)
    
    // Retry para limites de taxa (429) ou erros de servidor (5xx)
    if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
      if (retries > 0) {
        console.warn(`Runware API retornou status ${res.status}. Tentando novamente em ${delay}ms... (Tentativas restantes: ${retries})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return fetchWithRetry(url, options, retries - 1, delay * 2)
      }
    }
    return res
  } catch (error) {
    if (retries > 0) {
      console.warn(`Falha na requisição para Runware: ${(error as Error).message}. Tentando novamente em ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return fetchWithRetry(url, options, retries - 1, delay * 2)
    }
    throw error
  }
}

/**
 * Envia uma ou mais tarefas para a API da Runware
 * @param tasks Lista de tarefas de inferência (imagem, vídeo, áudio, texto)
 */
export async function sendRunwareTasks(tasks: RunwareTask[]) {
  const apiKey = process.env.RUNWARE_API_KEY
  if (!apiKey) {
    throw new Error('A variável RUNWARE_API_KEY não foi configurada nas variáveis de ambiente.')
  }

  // Prepara as tarefas com UUID se não fornecido
  const tasksWithUUID = tasks.map(task => ({
    ...task,
    taskUUID: task.taskUUID || uuidv4()
  }))

  const response = await fetchWithRetry(RUNWARE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(tasksWithUUID)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Erro na API Runware (${response.status}): ${errorText}`)
  }

  const json = await response.json()
  
  // A API da Runware geralmente retorna um objeto JSON que contém as tarefas executadas e resultados.
  // Exemplo: { data: [ { taskUUID: "...", imageURL: "...", status: "success" } ] }
  // Ou retorna diretamente um array de resultados. Daremos suporte a ambas as estruturas.
  return {
    results: json.data || json,
    tasksSent: tasksWithUUID
  }
}
