# Admin: Export, Marketing, Webhooks e Reporte de Bugs — Plano de Implementação

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adicionar ao painel admin: export de usuários em CSV/TXT, e-mail marketing com campanhas via Resend, configuração de webhooks de notificação por evento/canal, e sistema completo de reporte de bugs com recompensa de fichas.

**Architecture:** Quatro features independentes. Migration SQL cria as tabelas necessárias. APIs usam `createAdminClient()` de `src/lib/supabase/server.ts` (service role). Páginas admin usam `supabase` de `@/app/lib/supabase` (padrão do projeto). O reporte de bugs tem dois lados: modal no app do usuário (configuracoes) e painel admin (/admin/bugs).

**Tech Stack:** Next.js App Router, Supabase (DB + Storage), Resend (já instalado), lucide-react, inline styles com CSS vars (padrão do projeto)

---

## Task 1: Migration SQL — Criar tabelas e bucket

**Files:**
- Create: `migration_admin_features.sql`

**Step 1: Criar o arquivo de migration**

```sql
-- migration_admin_features.sql

-- Tabela de reports de bugs
create table if not exists bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  descricao text not null,
  screenshot_url text,
  status text not null default 'pendente' check (status in ('pendente', 'verificado', 'recusado')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id)
);

-- RLS: usuário só vê seus próprios reports, admin vê tudo
alter table bug_reports enable row level security;

create policy "user_insert_own_bug" on bug_reports
  for insert with check (auth.uid() = user_id);

create policy "user_select_own_bug" on bug_reports
  for select using (auth.uid() = user_id);

create policy "service_role_all_bug" on bug_reports
  using (true) with check (true);

-- Tabela de configurações de notificações automáticas
create table if not exists notification_settings (
  id uuid primary key default gen_random_uuid(),
  evento text not null,
  canal text not null check (canal in ('email', 'whatsapp')),
  ativo boolean not null default false,
  webhook_url text,
  dias_inatividade int,
  updated_at timestamptz not null default now(),
  unique(evento, canal)
);

alter table notification_settings enable row level security;
create policy "service_role_all_notif" on notification_settings using (true) with check (true);

-- Seed de eventos padrão
insert into notification_settings (evento, canal, ativo) values
  ('new_user', 'email', false),
  ('new_user', 'whatsapp', false),
  ('payment_approved', 'email', false),
  ('payment_approved', 'whatsapp', false),
  ('plan_cancelled', 'email', false),
  ('plan_cancelled', 'whatsapp', false),
  ('user_inactive', 'email', false),
  ('user_inactive', 'whatsapp', false),
  ('new_match', 'email', false),
  ('new_match', 'whatsapp', false)
on conflict (evento, canal) do nothing;

-- Tabela de histórico de campanhas de marketing
create table if not exists marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  corpo text not null,
  segmento text not null default 'todos',
  total_destinatarios int not null default 0,
  status text not null default 'enviado' check (status in ('enviado', 'falhou')),
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

alter table marketing_campaigns enable row level security;
create policy "service_role_all_camp" on marketing_campaigns using (true) with check (true);
```

**Step 2: Rodar a migration**

Abrir o Supabase SQL Editor em https://supabase.com/dashboard e colar o conteúdo do arquivo `migration_admin_features.sql`. Clicar em Run.

**Step 3: Criar bucket bug-screenshots no Supabase Storage**

No Supabase Dashboard → Storage → New Bucket:
- Name: `bug-screenshots`
- Public: **NÃO** (privado)
- Clicar em Create

**Step 4: Commit**

```bash
git add migration_admin_features.sql
git commit -m "feat: migration tabelas bug_reports, notification_settings, marketing_campaigns"
```

---

## Task 2: API — Export de Usuários CSV/TXT

**Files:**
- Create: `src/app/api/admin/usuarios/export/route.ts`

**Step 1: Criar a API route**

```typescript
// src/app/api/admin/usuarios/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabaseAdmin = createAdminClient()
  const { searchParams } = new URL(req.url)

  const plano = searchParams.get('plano')
  const status = searchParams.get('status')
  const dataInicio = searchParams.get('data_inicio')
  const dataFim = searchParams.get('data_fim')
  const formato = searchParams.get('formato') ?? 'csv'

  // Buscar usuários da view admin_users com join de total gasto
  let query = supabaseAdmin
    .from('profiles')
    .select(`
      id,
      name,
      email,
      cpf,
      phone,
      plan,
      banned,
      verified,
      deleted_at,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(10000)

  if (plano && plano !== 'todos') query = query.eq('plan', plano)
  if (status === 'banidos')        query = query.eq('banned', true)
  if (status === 'ativos')         query = query.eq('banned', false).is('deleted_at', null)
  if (status === 'excluidos')      query = query.not('deleted_at', 'is', null)
  if (status === 'nao_verificados') query = query.eq('verified', false).eq('banned', false)
  if (dataInicio) query = query.gte('created_at', dataInicio)
  if (dataFim)    query = query.lte('created_at', dataFim + 'T23:59:59Z')

  const { data: users, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Buscar total gasto por usuário (soma de compras de fichas aprovadas)
  const userIds = (users ?? []).map((u: any) => u.id)
  let totalGastoPorUser: Record<string, number> = {}

  if (userIds.length > 0) {
    const { data: gastos } = await supabaseAdmin
      .from('cakto_webhook_log')
      .select('user_id, amount_brl')
      .in('user_id', userIds)

    for (const g of gastos ?? []) {
      if (!totalGastoPorUser[g.user_id]) totalGastoPorUser[g.user_id] = 0
      totalGastoPorUser[g.user_id] += Number(g.amount_brl ?? 0)
    }
  }

  // Mapear status
  function getStatus(u: any) {
    if (u.banned) return 'banido'
    if (u.deleted_at) return 'excluido'
    if (!u.verified) return 'pendente'
    return 'ativo'
  }

  const rows = (users ?? []).map((u: any) => ({
    nome: u.name ?? '',
    email: u.email ?? '',
    cpf: u.cpf ?? '',
    telefone: u.phone ?? '',
    plano: u.plan ?? 'sem plano',
    status: getStatus(u),
    data_cadastro: new Date(u.created_at).toLocaleDateString('pt-BR'),
    total_gasto_rs: (totalGastoPorUser[u.id] ?? 0).toFixed(2),
  }))

  const headers = ['Nome', 'Email', 'CPF', 'Telefone', 'Plano', 'Status', 'Data Cadastro', 'Total Gasto (R$)']
  const keys: (keyof typeof rows[0])[] = ['nome', 'email', 'cpf', 'telefone', 'plano', 'status', 'data_cadastro', 'total_gasto_rs']

  let content: string
  let contentType: string
  let filename: string

  if (formato === 'txt') {
    const separator = '\t'
    content = [headers.join(separator), ...rows.map(r => keys.map(k => r[k]).join(separator))].join('\n')
    contentType = 'text/plain; charset=utf-8'
    filename = `usuarios_${new Date().toISOString().slice(0,10)}.txt`
  } else {
    content = [headers.join(','), ...rows.map(r => keys.map(k => `"${String(r[k]).replace(/"/g, '""')}"`).join(','))].join('\n')
    contentType = 'text/csv; charset=utf-8'
    filename = `usuarios_${new Date().toISOString().slice(0,10)}.csv`
  }

  return new NextResponse('\uFEFF' + content, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

**Step 2: Commit**

```bash
git add src/app/api/admin/usuarios/export/route.ts
git commit -m "feat: API GET /api/admin/usuarios/export com filtros e campos completos"
```

---

## Task 3: UI — Botão de Export na página /admin/usuarios

**Files:**
- Modify: `src/app/admin/usuarios/page.tsx`

**Step 1: Adicionar estado e função de export**

Após a linha `const [banReason, setBanReason] = useState('')`, adicionar:

```typescript
const [exporting, setExporting] = useState(false)
const [exportFormat, setExportFormat] = useState<'csv' | 'txt'>('csv')
const [dateRange, setDateRange] = useState({ inicio: '', fim: '' })
```

Adicionar a função de export antes do `return`:

```typescript
async function exportUsers() {
  setExporting(true)
  const params = new URLSearchParams()
  if (filter !== 'todos') {
    if (['essencial', 'plus', 'black'].includes(filter)) params.set('plano', filter)
    else params.set('status', filter)
  }
  if (dateRange.inicio) params.set('data_inicio', dateRange.inicio)
  if (dateRange.fim) params.set('data_fim', dateRange.fim)
  params.set('formato', exportFormat)

  const res = await fetch(`/api/admin/usuarios/export?${params}`)
  if (res.ok) {
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFormat === 'csv' ? 'usuarios.csv' : 'usuarios.txt'
    a.click()
    URL.revokeObjectURL(url)
  }
  setExporting(false)
}
```

**Step 2: Adicionar barra de export abaixo dos filtros existentes**

Adicionar antes da tag `{/* Tabela */}`:

```tsx
{/* Barra de export */}
<div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
  <input
    type="date"
    value={dateRange.inicio}
    onChange={e => setDateRange(d => ({ ...d, inicio: e.target.value }))}
    style={{ padding: '8px 12px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
  />
  <span style={{ color: '#444', fontSize: '13px' }}>até</span>
  <input
    type="date"
    value={dateRange.fim}
    onChange={e => setDateRange(d => ({ ...d, fim: e.target.value }))}
    style={{ padding: '8px 12px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
  />
  <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
    {(['csv', 'txt'] as const).map(fmt => (
      <button key={fmt} onClick={() => setExportFormat(fmt)} style={{
        padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
        backgroundColor: exportFormat === fmt ? '#1a1a1a' : 'transparent',
        color: exportFormat === fmt ? '#fff' : '#555',
      }}>.{fmt}</button>
    ))}
    <button onClick={exportUsers} disabled={exporting} style={{
      padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: exporting ? 'not-allowed' : 'pointer',
      backgroundColor: '#e11d48', color: '#fff', fontSize: '13px', fontWeight: '600',
      opacity: exporting ? 0.6 : 1,
    }}>
      {exporting ? 'Exportando...' : 'Exportar'}
    </button>
  </div>
</div>
```

**Step 3: Commit**

```bash
git add src/app/admin/usuarios/page.tsx
git commit -m "feat: botão de export CSV/TXT com filtros de data em /admin/usuarios"
```

---

## Task 4: API — Reporte de Bugs (lado do usuário)

**Files:**
- Create: `src/app/api/bugs/reportar/route.ts`

**Step 1: Criar a API route**

```typescript
// src/app/api/bugs/reportar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()

  // Rate limit: máx 3 reports por dia por usuário
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const { count } = await supabaseAdmin
    .from('bug_reports')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', hoje.toISOString())

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'Limite de 3 reportes por dia atingido' }, { status: 429 })
  }

  const formData = await req.formData()
  const descricao = formData.get('descricao') as string
  const screenshot = formData.get('screenshot') as File | null

  if (!descricao || descricao.trim().length < 20) {
    return NextResponse.json({ error: 'Descreva o problema com pelo menos 20 caracteres' }, { status: 400 })
  }

  let screenshot_url: string | null = null

  if (screenshot && screenshot.size > 0) {
    if (screenshot.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem deve ter no máximo 5MB' }, { status: 400 })
    }
    const ext = screenshot.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('bug-screenshots')
      .upload(path, screenshot, { contentType: screenshot.type, upsert: false })

    if (!uploadError) {
      const { data: urlData } = supabaseAdmin.storage
        .from('bug-screenshots')
        .getPublicUrl(path)
      screenshot_url = urlData.publicUrl
    }
  }

  const { error } = await supabaseAdmin
    .from('bug_reports')
    .insert({ user_id: user.id, descricao: descricao.trim(), screenshot_url })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
```

**Step 2: Commit**

```bash
git add src/app/api/bugs/reportar/route.ts
git commit -m "feat: API POST /api/bugs/reportar com upload de screenshot e rate limit"
```

---

## Task 5: UI — Modal de reporte de bugs em /configuracoes

**Files:**
- Modify: `src/app/configuracoes/page.tsx`

**Step 1: Localizar a seção "Suporte" na página**

A página tem uma seção `Suporte` com `LinkRow`. Precisamos adicionar um item "Reportar problema" que **não** é um link, mas abre um modal inline.

**Step 2: Adicionar estado do modal e componente**

No topo do componente `ConfiguracoesPage`, após os imports existentes, adicionar estados:

```typescript
const [bugModal, setBugModal] = useState(false)
const [bugDescricao, setBugDescricao] = useState('')
const [bugFile, setBugFile] = useState<File | null>(null)
const [bugEnviando, setBugEnviando] = useState(false)
const [bugEnviado, setBugEnviado] = useState(false)
```

**Step 3: Adicionar função de envio**

```typescript
async function enviarBug() {
  if (bugDescricao.trim().length < 20) return
  setBugEnviando(true)
  const fd = new FormData()
  fd.append('descricao', bugDescricao)
  if (bugFile) fd.append('screenshot', bugFile)
  const res = await fetch('/api/bugs/reportar', { method: 'POST', body: fd })
  setBugEnviando(false)
  if (res.ok) {
    setBugEnviado(true)
    setBugDescricao('')
    setBugFile(null)
  }
}
```

**Step 4: Adicionar botão na seção Suporte**

Localizar a seção `Suporte` da página (contém links como "Central de Ajuda"). Adicionar após os itens existentes de suporte um botão que abre o modal:

```tsx
<button onClick={() => { setBugModal(true); setBugEnviado(false) }} style={{
  display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
  borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'left',
}}>
  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <Bug size={18} color="rgba(255,255,255,0.55)" strokeWidth={1.5} />
  </div>
  <div style={{ flex: 1 }}>
    <p style={{ color: '#fff', fontSize: '15px', fontWeight: 500, margin: 0 }}>Reportar problema</p>
    <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: '12px', margin: '2px 0 0' }}>Encontrou um bug? Nos avise</p>
  </div>
  <ChevronRight size={16} color="rgba(255,255,255,0.20)" />
</button>
```

Adicionar `Bug` ao import do `lucide-react`.

**Step 5: Adicionar o modal ao final do JSX (antes do fechamento da div principal)**

```tsx
{bugModal && (
  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100, padding: '0' }}>
    <div style={{ backgroundColor: '#0F1117', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '430px', padding: '24px 20px 36px' }}>
      {bugEnviado ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🙏</div>
          <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', marginBottom: '8px' }}>Obrigado pela sua contribuicao!</h3>
          <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: '14px', lineHeight: 1.6 }}>
            Nossa equipe ira analisar o problema. Se for constatado, voce recebera uma recompensa especial.
          </p>
          <button onClick={() => setBugModal(false)} style={{ marginTop: '20px', padding: '12px 24px', backgroundColor: '#e11d48', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', width: '100%' }}>
            Fechar
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px' }}>Reportar problema</h3>
            <button onClick={() => setBugModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', padding: '4px' }}>
              <X size={20} />
            </button>
          </div>
          <textarea
            placeholder="O que aconteceu? Descreva o problema com detalhes (minimo 20 caracteres)..."
            value={bugDescricao}
            onChange={e => setBugDescricao(e.target.value)}
            rows={5}
            style={{ width: '100%', backgroundColor: '#13161F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '14px', resize: 'none', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#13161F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', cursor: 'pointer', marginBottom: '16px' }}>
            <Paperclip size={16} color="rgba(255,255,255,0.40)" strokeWidth={1.5} />
            <span style={{ color: bugFile ? '#fff' : 'rgba(255,255,255,0.40)', fontSize: '14px' }}>
              {bugFile ? bugFile.name : 'Anexar print (opcional)'}
            </span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setBugFile(e.target.files?.[0] ?? null)} />
          </label>
          <button
            onClick={enviarBug}
            disabled={bugEnviando || bugDescricao.trim().length < 20}
            style={{ width: '100%', padding: '14px', backgroundColor: '#e11d48', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: bugDescricao.trim().length < 20 ? 'not-allowed' : 'pointer', opacity: bugDescricao.trim().length < 20 ? 0.5 : 1 }}
          >
            {bugEnviando ? 'Enviando...' : 'Enviar reporte'}
          </button>
        </>
      )}
    </div>
  </div>
)}
```

Adicionar `X, Paperclip` ao import do `lucide-react`.

**Step 6: Commit**

```bash
git add src/app/configuracoes/page.tsx
git commit -m "feat: modal de reporte de bugs em configuracoes com upload de screenshot"
```

---

## Task 6: APIs — Gerenciamento de bugs (admin)

**Files:**
- Create: `src/app/api/admin/bugs/route.ts`
- Create: `src/app/api/admin/bugs/[id]/verificar/route.ts`
- Create: `src/app/api/admin/bugs/[id]/recusar/route.ts`

**Step 1: Criar GET /api/admin/bugs**

```typescript
// src/app/api/admin/bugs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabaseAdmin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pendente'

  let query = supabaseAdmin
    .from('bug_reports')
    .select(`
      id, descricao, screenshot_url, status, created_at, reviewed_at,
      user:user_id (id, name, email, plan)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status !== 'todos') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
```

**Step 2: Criar POST /api/admin/bugs/[id]/verificar**

```typescript
// src/app/api/admin/bugs/[id]/verificar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()

  // Buscar o report
  const { data: report } = await supabaseAdmin
    .from('bug_reports')
    .select('user_id, status')
    .eq('id', id)
    .single()

  if (!report) return NextResponse.json({ error: 'Report não encontrado' }, { status: 404 })
  if (report.status !== 'pendente') return NextResponse.json({ error: 'Report já foi revisado' }, { status: 400 })

  // Creditar 5 fichas ao usuário
  try {
    await supabaseAdmin.rpc('credit_fichas', { p_user_id: report.user_id, p_amount: 5, p_reason: 'bug_report_reward' })
  } catch (e) {
    // Se RPC falhar, tentar update direto
    await supabaseAdmin.from('profiles').update({ fichas: supabaseAdmin.rpc('coalesce', []) }).eq('id', report.user_id)
  }

  // Atualizar status
  const { error } = await supabaseAdmin
    .from('bug_reports')
    .update({ status: 'verificado', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

**Step 3: Criar POST /api/admin/bugs/[id]/recusar**

```typescript
// src/app/api/admin/bugs/[id]/recusar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('bug_reports')
    .update({ status: 'recusado', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

**Step 4: Commit**

```bash
git add src/app/api/admin/bugs/route.ts src/app/api/admin/bugs/[id]/verificar/route.ts src/app/api/admin/bugs/[id]/recusar/route.ts
git commit -m "feat: APIs admin de bugs (listar, verificar com fichas, recusar)"
```

---

## Task 7: UI — Painel admin /admin/bugs + navegação

**Files:**
- Create: `src/app/admin/bugs/page.tsx`
- Modify: `src/app/admin/layout.tsx`

**Step 1: Criar a página /admin/bugs**

```typescript
// src/app/admin/bugs/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react'

const STATUS_FILTERS = ['pendente', 'verificado', 'recusado', 'todos']
const STATUS_LABELS: Record<string, string> = { pendente: 'Pendentes', verificado: 'Verificados', recusado: 'Recusados', todos: 'Todos' }

export default function AdminBugs() {
  const [bugs, setBugs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pendente')
  const [selectedBug, setSelectedBug] = useState<any | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { loadBugs() }, [statusFilter])

  async function loadBugs() {
    setLoading(true)
    const res = await fetch(`/api/admin/bugs?status=${statusFilter}`)
    const json = await res.json()
    setBugs(json.data ?? [])
    setLoading(false)
  }

  async function verificar(id: string) {
    setActionLoading(true)
    await fetch(`/api/admin/bugs/${id}/verificar`, { method: 'POST' })
    setSelectedBug(null)
    setActionLoading(false)
    loadBugs()
  }

  async function recusar(id: string) {
    setActionLoading(true)
    await fetch(`/api/admin/bugs/${id}/recusar`, { method: 'POST' })
    setSelectedBug(null)
    setActionLoading(false)
    loadBugs()
  }

  const STATUS_COLOR: Record<string, string> = { pendente: '#f59e0b', verificado: '#22c55e', recusado: '#ef4444' }

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-fraunces)', marginBottom: '24px' }}>Reporte de Bugs</h1>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
            backgroundColor: statusFilter === s ? '#e11d48' : '#1a1a1a',
            color: statusFilter === s ? '#fff' : '#666',
          }}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
              {['Data', 'Usuário', 'Descrição', 'Print', 'Status', 'Ações'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#444', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Carregando...</td></tr>
            ) : bugs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Nenhum report</td></tr>
            ) : bugs.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid #161616', cursor: 'pointer' }} onClick={() => setSelectedBug(b)}>
                <td style={{ padding: '12px 16px', color: '#555', fontSize: '13px' }}>{new Date(b.created_at).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '12px 16px' }}>
                  <p style={{ color: '#fff', margin: 0, fontSize: '14px' }}>{b.user?.name ?? '—'}</p>
                  <p style={{ color: '#555', margin: 0, fontSize: '12px' }}>{b.user?.plan ?? '—'}</p>
                </td>
                <td style={{ padding: '12px 16px', color: '#888', maxWidth: '300px' }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.descricao}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {b.screenshot_url ? <ImageIcon size={16} color="#3b82f6" /> : <span style={{ color: '#333' }}>—</span>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '600', backgroundColor: STATUS_COLOR[b.status] + '22', color: STATUS_COLOR[b.status] }}>
                    {b.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {b.status === 'pendente' && (
                    <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => verificar(b.id)} disabled={actionLoading} style={{ padding: '6px 12px', backgroundColor: '#22c55e22', color: '#22c55e', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                        Verificar
                      </button>
                      <button onClick={() => recusar(b.id)} disabled={actionLoading} style={{ padding: '6px 12px', backgroundColor: '#ef444422', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                        Recusar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de detalhe */}
      {selectedBug && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', margin: 0 }}>{selectedBug.user?.name ?? 'Usuário'}</h3>
                <p style={{ color: '#555', fontSize: '13px', margin: '4px 0 0' }}>{selectedBug.user?.email} · {selectedBug.user?.plan ?? 'sem plano'}</p>
              </div>
              <button onClick={() => setSelectedBug(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '20px' }}>×</button>
            </div>

            <p style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Descrição</p>
            <p style={{ color: '#ddd', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px', whiteSpace: 'pre-wrap' }}>{selectedBug.descricao}</p>

            {selectedBug.screenshot_url && (
              <>
                <p style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Screenshot</p>
                <img src={selectedBug.screenshot_url} alt="Screenshot do bug" style={{ width: '100%', borderRadius: '12px', marginBottom: '20px', border: '1px solid #222' }} />
              </>
            )}

            {selectedBug.status === 'pendente' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => verificar(selectedBug.id)} disabled={actionLoading} style={{ flex: 1, padding: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  Verificar e dar 5 fichas
                </button>
                <button onClick={() => recusar(selectedBug.id)} disabled={actionLoading} style={{ flex: 1, padding: '12px', backgroundColor: '#1a1a1a', color: '#ef4444', border: '1px solid #ef444433', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  Recusar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Adicionar "Bugs" na navegação do admin layout**

No arquivo `src/app/admin/layout.tsx`, adicionar o import do ícone e o item de navegação:

Localizar a linha:
```typescript
import { LayoutDashboard, Users, DollarSign, Flag, ShieldAlert, TrendingUp, LogOut, XCircle, UserCog, Award, BarChart2 } from 'lucide-react'
```

Adicionar `Bug` ao import:
```typescript
import { LayoutDashboard, Users, DollarSign, Flag, ShieldAlert, TrendingUp, LogOut, XCircle, UserCog, Award, BarChart2, Bug } from 'lucide-react'
```

Localizar o array `ALL_NAV` e adicionar o item de Bugs antes de `equipe`:
```typescript
{ href: '/admin/bugs',           label: 'Bugs',            icon: Bug             },
```

**Step 3: Commit**

```bash
git add src/app/admin/bugs/page.tsx src/app/admin/layout.tsx
git commit -m "feat: painel admin /admin/bugs com lista, detalhe e ações de verificar/recusar"
```

---

## Task 8: APIs — Marketing (campanhas + configurações de notificação)

**Files:**
- Create: `src/app/api/admin/marketing/campanha/route.ts`
- Create: `src/app/api/admin/marketing/historico/route.ts`
- Create: `src/app/api/admin/notificacoes/settings/route.ts`

**Step 1: API de envio de campanha**

```typescript
// src/app/api/admin/marketing/campanha/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()
  const { titulo, corpo, segmento } = await req.json()

  if (!titulo || !corpo) return NextResponse.json({ error: 'Título e corpo são obrigatórios' }, { status: 400 })

  // Buscar e-mails dos destinatários
  let query = supabaseAdmin
    .from('profiles')
    .select('email, name')
    .eq('banned', false)
    .is('deleted_at', null)
    .not('email', 'is', null)

  if (segmento === 'essencial' || segmento === 'plus' || segmento === 'black') {
    query = query.eq('plan', segmento)
  }

  const { data: destinatarios } = await query.limit(5000)
  const lista = (destinatarios ?? []).filter((d: any) => d.email)

  let status = 'enviado'
  try {
    // Resend suporta batch de até 100 — enviar em chunks
    const CHUNK = 100
    for (let i = 0; i < lista.length; i += CHUNK) {
      const chunk = lista.slice(i, i + CHUNK)
      await resend.batch.send(
        chunk.map((d: any) => ({
          from: 'MeAndYou <noreply@meandyou.com.br>',
          to: d.email,
          subject: titulo,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#e11d48">${titulo}</h2>
            <div style="color:#333;line-height:1.6">${corpo}</div>
            <hr style="margin:24px 0;border-color:#eee"/>
            <p style="color:#999;font-size:12px">MeAndYou · <a href="https://www.meandyou.com.br">meandyou.com.br</a></p>
          </div>`,
        }))
      )
    }
  } catch (e) {
    status = 'falhou'
  }

  // Salvar histórico
  await supabaseAdmin.from('marketing_campaigns').insert({
    titulo,
    corpo,
    segmento: segmento ?? 'todos',
    total_destinatarios: lista.length,
    status,
    created_by: user.id,
  })

  return NextResponse.json({ ok: true, total: lista.length, status })
}
```

**Step 2: API de histórico de campanhas**

```typescript
// src/app/api/admin/marketing/historico/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('marketing_campaigns')
    .select('id, titulo, segmento, total_destinatarios, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
```

**Step 3: API de configurações de notificação**

```typescript
// src/app/api/admin/notificacoes/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('notification_settings')
    .select('*')
    .order('evento')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = createAdminClient()
  const { evento, canal, ativo, webhook_url, dias_inatividade } = await req.json()

  const { error } = await supabaseAdmin
    .from('notification_settings')
    .upsert({ evento, canal, ativo, webhook_url, dias_inatividade, updated_at: new Date().toISOString() }, { onConflict: 'evento,canal' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

**Step 4: Commit**

```bash
git add src/app/api/admin/marketing/campanha/route.ts src/app/api/admin/marketing/historico/route.ts src/app/api/admin/notificacoes/settings/route.ts
git commit -m "feat: APIs de marketing (campanha via Resend, historico) e configuracoes de notificacao"
```

---

## Task 9: UI — Expandir /admin/marketing com abas

**Files:**
- Modify: `src/app/admin/marketing/page.tsx`

**Step 1: Reescrever a página com sistema de abas**

A página atual tem: Funil de conversão, Indicações, Contas excluídas.

Adicionar abas no topo: **Analytics** (conteúdo atual) | **Campanhas** | **Notificações**.

Substituir o `return` atual pelo novo JSX com abas:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { Send, Settings, BarChart2 } from 'lucide-react'

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'campanhas', label: 'Campanhas', icon: Send },
  { id: 'notificacoes', label: 'Notificacoes', icon: Settings },
]

const EVENTOS = [
  { key: 'new_user', label: 'Novo cadastro' },
  { key: 'payment_approved', label: 'Pagamento aprovado' },
  { key: 'plan_cancelled', label: 'Plano cancelado' },
  { key: 'user_inactive', label: 'Usuario inativo (dias)' },
  { key: 'new_match', label: 'Novo match' },
]

export default function AdminMarketing() {
  const [tab, setTab] = useState('analytics')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Campanhas
  const [campTitulo, setCampTitulo] = useState('')
  const [campCorpo, setCampCorpo] = useState('')
  const [campSegmento, setCampSegmento] = useState('todos')
  const [campEnviando, setCampEnviando] = useState(false)
  const [campResultado, setCampResultado] = useState<any>(null)
  const [historico, setHistorico] = useState<any[]>([])

  // Notificações
  const [notifSettings, setNotifSettings] = useState<any[]>([])
  const [whatsappUrl, setWhatsappUrl] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    if (tab === 'campanhas') loadHistorico()
    if (tab === 'notificacoes') loadNotifSettings()
  }, [tab])

  async function loadData() {
    const [
      { data: metrics },
      { data: signups },
      { data: referrals },
      { data: deleted },
    ] = await Promise.all([
      supabase.from('admin_metrics').select('*').single(),
      supabase.from('admin_signups_daily').select('*').limit(30),
      supabase.from('referrals').select('id, status, created_at, referred:referred_id(name), referrer:referrer_id(name)').order('created_at', { ascending: false }).limit(20),
      supabase.from('profiles').select('id, name, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }).limit(20),
    ])
    setData({ metrics, signups: signups || [], referrals: referrals || [], deleted: deleted || [] })
    setLoading(false)
  }

  async function loadHistorico() {
    const res = await fetch('/api/admin/marketing/historico')
    const json = await res.json()
    setHistorico(json.data ?? [])
  }

  async function loadNotifSettings() {
    const res = await fetch('/api/admin/notificacoes/settings')
    const json = await res.json()
    setNotifSettings(json.data ?? [])
    const wa = (json.data ?? []).find((s: any) => s.webhook_url)?.webhook_url ?? ''
    setWhatsappUrl(wa)
  }

  async function enviarCampanha() {
    if (!campTitulo || !campCorpo) return
    setCampEnviando(true)
    const res = await fetch('/api/admin/marketing/campanha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: campTitulo, corpo: campCorpo, segmento: campSegmento }),
    })
    const json = await res.json()
    setCampResultado(json)
    setCampEnviando(false)
    if (json.ok) { setCampTitulo(''); setCampCorpo(''); loadHistorico() }
  }

  async function toggleNotif(evento: string, canal: string, ativo: boolean) {
    const setting = notifSettings.find((s: any) => s.evento === evento && s.canal === canal)
    setNotifSettings(prev => prev.map((s: any) =>
      s.evento === evento && s.canal === canal ? { ...s, ativo } : s
    ))
    await fetch('/api/admin/notificacoes/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evento, canal, ativo, webhook_url: canal === 'whatsapp' ? whatsappUrl : null, dias_inatividade: setting?.dias_inatividade }),
    })
  }

  async function salvarWhatsapp() {
    setSalvando(true)
    for (const s of notifSettings.filter((s: any) => s.canal === 'whatsapp')) {
      await fetch('/api/admin/notificacoes/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento: s.evento, canal: 'whatsapp', ativo: s.ativo, webhook_url: whatsappUrl }),
      })
    }
    setSalvando(false)
  }

  function getSetting(evento: string, canal: string) {
    return notifSettings.find((s: any) => s.evento === evento && s.canal === canal)
  }

  if (loading || !data) return <div style={{ padding: '32px', color: '#555' }}>Carregando...</div>

  const { metrics, referrals, deleted } = data
  const total      = metrics?.total_users ?? 0
  const verified   = metrics?.total_verified ?? 0
  const subscribed = (metrics?.plan_essencial ?? 0) + (metrics?.plan_plus ?? 0) + (metrics?.plan_black ?? 0)
  const convRate   = total > 0 ? ((subscribed / total) * 100).toFixed(1) : '0'

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-fraunces)', marginBottom: '24px' }}>Marketing</h1>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', backgroundColor: '#111', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              backgroundColor: tab === t.id ? '#1a1a1a' : 'transparent',
              color: tab === t.id ? '#fff' : '#555', fontSize: '14px', fontWeight: tab === t.id ? '600' : '400',
            }}>
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Analytics (conteúdo original) */}
      {tab === 'analytics' && (
        <>
          <Section title="Funil de conversao">
            <div style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Cadastraram', value: total,      color: '#3b82f6' },
                { label: 'Verificaram', value: verified,   color: '#a855f7' },
                { label: 'Assinaram',   value: subscribed, color: '#22c55e' },
              ].map((step, i) => {
                const pct = total > 0 ? Math.round((step.value / total) * 100) : 0
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#888' }}>{step.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{step.value} <span style={{ color: '#555', fontWeight: '400' }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#1e1e1e', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: step.color, borderRadius: '100px' }} />
                    </div>
                  </div>
                )
              })}
              <p style={{ fontSize: '12px', color: '#444', marginTop: '8px' }}>Taxa cadastro → assinatura: <strong style={{ color: '#22c55e' }}>{convRate}%</strong></p>
            </div>
          </Section>

          <Section title={`Indicacoes (${referrals.length})`}>
            <div style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', overflow: 'hidden' }}>
              {referrals.length === 0 ? (
                <p style={{ padding: '20px', color: '#444', textAlign: 'center' }}>Nenhuma indicacao ainda</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                      {['Indicou', 'Indicado', 'Status', 'Data'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#444', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r: any) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #161616' }}>
                        <td style={{ padding: '12px 16px' }}>{r.referrer?.name ?? '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#888' }}>{r.referred?.name ?? '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '600',
                            backgroundColor: r.status === 'rewarded' ? '#22c55e22' : '#f59e0b22',
                            color: r.status === 'rewarded' ? '#22c55e' : '#f59e0b',
                          }}>{r.status === 'rewarded' ? 'Convertida' : 'Pendente'}</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#444', fontSize: '13px' }}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Section>
        </>
      )}

      {/* Campanhas */}
      {tab === 'campanhas' && (
        <>
          <Section title="Nova campanha">
            <div style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                placeholder="Assunto do e-mail"
                value={campTitulo}
                onChange={e => setCampTitulo(e.target.value)}
                style={{ padding: '10px 14px', backgroundColor: '#1a1a1a', border: '1px solid #222', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['todos', 'essencial', 'plus', 'black'].map(s => (
                  <button key={s} onClick={() => setCampSegmento(s)} style={{
                    padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
                    backgroundColor: campSegmento === s ? '#e11d48' : '#1a1a1a',
                    color: campSegmento === s ? '#fff' : '#666',
                  }}>{s === 'todos' ? 'Todos os usuarios' : `Plano ${s}`}</button>
                ))}
              </div>
              <textarea
                placeholder="Corpo do e-mail (suporta HTML simples)"
                value={campCorpo}
                onChange={e => setCampCorpo(e.target.value)}
                rows={8}
                style={{ padding: '12px 14px', backgroundColor: '#1a1a1a', border: '1px solid #222', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical' }}
              />
              {campResultado && (
                <div style={{ padding: '12px', backgroundColor: campResultado.ok ? '#22c55e11' : '#ef444411', border: `1px solid ${campResultado.ok ? '#22c55e33' : '#ef444433'}`, borderRadius: '10px', fontSize: '13px', color: campResultado.ok ? '#22c55e' : '#ef4444' }}>
                  {campResultado.ok ? `Campanha enviada para ${campResultado.total} destinatarios!` : 'Erro ao enviar campanha. Verifique as configuracoes do Resend.'}
                </div>
              )}
              <button onClick={enviarCampanha} disabled={campEnviando || !campTitulo || !campCorpo} style={{
                padding: '12px', backgroundColor: '#e11d48', color: '#fff', border: 'none', borderRadius: '10px',
                cursor: (!campTitulo || !campCorpo) ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600',
                opacity: (!campTitulo || !campCorpo) ? 0.5 : 1,
              }}>
                {campEnviando ? 'Enviando...' : 'Enviar campanha'}
              </button>
            </div>
          </Section>

          <Section title="Historico de campanhas">
            <div style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', overflow: 'hidden' }}>
              {historico.length === 0 ? (
                <p style={{ padding: '20px', color: '#444', textAlign: 'center' }}>Nenhuma campanha enviada ainda</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                      {['Data', 'Assunto', 'Segmento', 'Enviados', 'Status'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#444', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((c: any) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #161616' }}>
                        <td style={{ padding: '12px 16px', color: '#555', fontSize: '13px' }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: '12px 16px', color: '#fff' }}>{c.titulo}</td>
                        <td style={{ padding: '12px 16px', color: '#888' }}>{c.segmento}</td>
                        <td style={{ padding: '12px 16px', color: '#888' }}>{c.total_destinatarios}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '600',
                            backgroundColor: c.status === 'enviado' ? '#22c55e22' : '#ef444422',
                            color: c.status === 'enviado' ? '#22c55e' : '#ef4444',
                          }}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Section>
        </>
      )}

      {/* Configurações de notificação */}
      {tab === 'notificacoes' && (
        <>
          <Section title="WhatsApp Business API">
            <div style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '20px' }}>
              <p style={{ color: '#555', fontSize: '13px', marginBottom: '12px' }}>URL do webhook do provedor WhatsApp (Z-API, Evolution API, Twilio, etc). Deixe em branco ate contratar o servico.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  placeholder="https://api.z-api.io/instances/xxx/send-text"
                  value={whatsappUrl}
                  onChange={e => setWhatsappUrl(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', backgroundColor: '#1a1a1a', border: '1px solid #222', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none' }}
                />
                <button onClick={salvarWhatsapp} disabled={salvando} style={{ padding: '10px 20px', backgroundColor: '#e11d48', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </Section>

          <Section title="Eventos automaticos">
            <div style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                    {['Evento', 'E-mail', 'WhatsApp'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#444', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EVENTOS.map(ev => {
                    const emailSetting = getSetting(ev.key, 'email')
                    const waSetting = getSetting(ev.key, 'whatsapp')
                    return (
                      <tr key={ev.key} style={{ borderBottom: '1px solid #161616' }}>
                        <td style={{ padding: '12px 16px', color: '#ccc' }}>{ev.label}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => toggleNotif(ev.key, 'email', !(emailSetting?.ativo ?? false))} style={{
                            width: '44px', height: '26px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                            backgroundColor: emailSetting?.ativo ? '#e11d48' : 'rgba(255,255,255,0.12)',
                            position: 'relative', flexShrink: 0, transition: 'background-color 0.22s',
                          }}>
                            <span style={{ position: 'absolute', top: '3px', left: emailSetting?.ativo ? '21px' : '3px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.22s' }} />
                          </button>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => toggleNotif(ev.key, 'whatsapp', !(waSetting?.ativo ?? false))} disabled={!whatsappUrl} style={{
                            width: '44px', height: '26px', borderRadius: '100px', border: 'none', cursor: whatsappUrl ? 'pointer' : 'not-allowed',
                            backgroundColor: waSetting?.ativo && whatsappUrl ? '#e11d48' : 'rgba(255,255,255,0.12)',
                            position: 'relative', flexShrink: 0, transition: 'background-color 0.22s', opacity: whatsappUrl ? 1 : 0.4,
                          }}>
                            <span style={{ position: 'absolute', top: '3px', left: (waSetting?.ativo && whatsappUrl) ? '21px' : '3px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.22s' }} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!whatsappUrl && <p style={{ padding: '12px 16px', color: '#555', fontSize: '12px' }}>Configure a URL do WhatsApp acima para ativar notificacoes via WhatsApp.</p>}
            </div>
          </Section>
        </>
      )}
    </div>
  )
}

function Section({ title, children }: any) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <p style={{ fontSize: '12px', fontWeight: '600', color: '#444', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
      {children}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/admin/marketing/page.tsx
git commit -m "feat: /admin/marketing expandido com abas Analytics, Campanhas e Notificacoes"
```

---

## Task 10: Verificação final

**Step 1: Buildar o projeto**

```bash
cd /home/leandro/projetos/meandyou-app && npm run build
```

Expected: Build concluído sem erros de TypeScript críticos.

**Step 2: Checar que as rotas existem**

```bash
find src/app/api/admin -type f | sort
find src/app/admin/bugs -type f | sort
```

Expected:
```
src/app/api/admin/bugs/route.ts
src/app/api/admin/bugs/[id]/verificar/route.ts
src/app/api/admin/bugs/[id]/recusar/route.ts
src/app/api/admin/marketing/campanha/route.ts
src/app/api/admin/marketing/historico/route.ts
src/app/api/admin/notificacoes/settings/route.ts
src/app/api/admin/usuarios/export/route.ts
src/app/admin/bugs/page.tsx
```

**Step 3: Push para main**

```bash
git push origin main
```

---

## Resumo de arquivos criados/modificados

| Arquivo | Ação |
|---|---|
| `migration_admin_features.sql` | Criar — rodar no Supabase |
| `src/app/api/admin/usuarios/export/route.ts` | Criar |
| `src/app/api/bugs/reportar/route.ts` | Criar |
| `src/app/api/admin/bugs/route.ts` | Criar |
| `src/app/api/admin/bugs/[id]/verificar/route.ts` | Criar |
| `src/app/api/admin/bugs/[id]/recusar/route.ts` | Criar |
| `src/app/api/admin/marketing/campanha/route.ts` | Criar |
| `src/app/api/admin/marketing/historico/route.ts` | Criar |
| `src/app/api/admin/notificacoes/settings/route.ts` | Criar |
| `src/app/admin/bugs/page.tsx` | Criar |
| `src/app/admin/usuarios/page.tsx` | Modificar — adicionar export |
| `src/app/admin/layout.tsx` | Modificar — adicionar Bugs na nav |
| `src/app/admin/marketing/page.tsx` | Modificar — adicionar abas |
| `src/app/configuracoes/page.tsx` | Modificar — adicionar modal de bug |
