# Arquitetura — SaaS de Geração de Conteúdo IA com Runware

## Visão geral

Plataforma web com assinatura mensal que permite usuários gerarem imagens, vídeos, áudios e textos via IA. O backend de inferência é a Runware API. O modelo de negócio é baseado em créditos por plano.

---

## Stack tecnológica

| Camada | Tecnologia | Função |
|---|---|---|
| Frontend + API Routes | Next.js 14 (App Router) | UI, rotas autenticadas, chamadas de backend |
| Autenticação | Supabase Auth | Login email/senha + OAuth (Google) |
| Banco de dados | Supabase PostgreSQL | Usuários, planos, histórico, créditos |
| Armazenamento | Supabase Storage | Arquivos gerados (imagens, vídeos, áudios) |
| Pagamentos | Stripe | Assinaturas recorrentes, webhooks, portal de faturamento |
| Geração de IA | Runware API | Imagem, vídeo, áudio, texto (LLMs) |
| Deploy | Vercel | Hosting, CDN global, variáveis de ambiente |
| IDE / Dev | Google Antigravity | Desenvolvimento agêntico |

---

## Estrutura de planos e créditos

### Modelo de créditos
- Cada geração consome créditos de acordo com a modalidade
- Créditos são resetados mensalmente no ciclo de cobrança
- Créditos não utilizados não acumulam (salvo plano Premium)

### Tabela de planos (sugestão inicial)

| Plano | Preço/mês | Créditos/mês | Modalidades | Observação |
|---|---|---|---|---|
| Free | R$ 0 | 50 | Só imagem | Limite por dia: 10 gerações |
| Starter | R$ 29 | 500 | Imagem + texto | — |
| Pro | R$ 79 | 2.000 | Imagem + vídeo + áudio + texto | — |
| Premium | R$ 199 | 10.000 | Tudo + créditos acumulam | API key própria futura |

### Custo por modalidade (em créditos)

| Tipo | Créditos consumidos |
|---|---|
| Imagem (512×512) | 2 créditos |
| Imagem (1024×1024) | 5 créditos |
| Vídeo curto (até 5s) | 30 créditos |
| Áudio (até 30s) | 10 créditos |
| Texto / LLM (1k tokens) | 1 crédito |

---

## Estrutura de banco de dados (Supabase)

### Tabela `users`
```sql
id uuid PRIMARY KEY
email text UNIQUE
name text
avatar_url text
created_at timestamp
```

### Tabela `subscriptions`
```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES users
plan text -- 'free' | 'starter' | 'pro' | 'premium'
stripe_customer_id text
stripe_subscription_id text
status text -- 'active' | 'canceled' | 'past_due'
current_period_end timestamp
credits_remaining int
credits_total int
updated_at timestamp
```

### Tabela `generations`
```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES users
type text -- 'image' | 'video' | 'audio' | 'text'
prompt text
model text
output_url text
credits_used int
metadata jsonb
created_at timestamp
```

---

## Fluxo de autenticação

1. Usuário acessa `/login`
2. Supabase Auth processa email/senha ou OAuth (Google)
3. Sessão JWT é criada e armazenada em cookie httpOnly
4. Middleware do Next.js valida o JWT em cada rota protegida
5. Se inválido → redireciona para `/login`

---

## Fluxo de geração de conteúdo

1. Usuário preenche o prompt no Dashboard
2. Frontend chama `POST /api/generate`
3. API Route verifica:
   - Usuário autenticado
   - Plano permite a modalidade escolhida
   - Créditos suficientes
4. Se tudo ok: chama Runware API com o prompt
5. Runware retorna URL do conteúdo gerado
6. API Route:
   - Salva geração na tabela `generations`
   - Debita créditos na tabela `subscriptions`
   - Retorna URL para o frontend
7. Frontend exibe o conteúdo e atualiza saldo de créditos

---

## Fluxo de assinatura (Stripe)

1. Usuário clica em "Fazer upgrade" na página de planos
2. Frontend chama `POST /api/create-checkout-session`
3. API Route cria uma Stripe Checkout Session e retorna a URL
4. Usuário completa pagamento no Stripe
5. Stripe envia webhook para `POST /api/webhooks/stripe`
6. Webhook handler processa:
   - `checkout.session.completed` → ativa plano, define créditos
   - `invoice.payment_succeeded` → renova créditos mensalmente
   - `customer.subscription.deleted` → rebaixa para Free
7. Supabase é atualizado com novo status e créditos

---

## Páginas principais

| Rota | Descrição |
|---|---|
| `/` | Landing page (hero, planos, CTA) |
| `/login` | Login / cadastro |
| `/dashboard` | Painel de geração de conteúdo |
| `/dashboard/history` | Histórico de gerações com download |
| `/dashboard/credits` | Saldo de créditos e uso |
| `/planos` | Tabela de planos com botões de upgrade |
| `/billing` | Portal de faturamento Stripe (Customer Portal) |
| `/api/generate` | API Route de geração |
| `/api/create-checkout-session` | API Route Stripe Checkout |
| `/api/webhooks/stripe` | Webhook handler |

---

## Variáveis de ambiente necessárias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Runware
RUNWARE_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://seudominio.com.br
```

---

## Configuração da Runware API

### Endpoint
```
POST https://api.runware.ai/v1
Authorization: Bearer {RUNWARE_API_KEY}
```

### Exemplo: geração de imagem
```json
[
  {
    "taskType": "imageInference",
    "taskUUID": "uuid-aqui",
    "model": "bfl:5@1",
    "positivePrompt": "prompt do usuário",
    "width": 1024,
    "height": 1024
  }
]
```

### Modelo de seleção por modalidade

| Modalidade | Parâmetro `model` sugerido |
|---|---|
| Imagem (qualidade) | `bfl:5@1` (Flux Pro) |
| Imagem (rápido/barato) | `stability:sdxl` |
| Vídeo | `google-veo-3-1-fast` |
| Áudio | `elevenlabs-flash-v2-5` |
| Texto (LLM) | `anthropic-claude-sonnet-4-6` |

---

## Pontos de atenção para o desenvolvimento

1. **Rate limit da Runware:** Implementar retry com backoff exponencial em caso de erro 429
2. **Webhook Stripe:** Validar assinatura com `stripe.webhooks.constructEvent` antes de processar
3. **Créditos em race condition:** Usar transação no Supabase para debitar créditos (não pode debitar duas vezes)
4. **Armazenamento de arquivos:** Fazer proxy dos arquivos gerados para Supabase Storage (a URL da Runware pode expirar)
5. **Free plan:** Implementar rate limit por dia com Redis ou Supabase (evitar abuso)
6. **LGPD:** Permitir que o usuário exclua conta e todos os dados gerados

---

## Ordem de desenvolvimento sugerida

1. Setup do projeto Next.js + Supabase Auth + Vercel
2. Criação das tabelas no Supabase
3. Páginas de login e dashboard esqueleto
4. Integração com Runware (geração de imagens primeiro)
5. Controle de créditos (debitar ao gerar)
6. Integração com Stripe (planos + webhook)
7. Histórico de gerações + download
8. Landing page + página de planos
9. Portal de faturamento Stripe
10. Expansão para vídeo, áudio e texto
