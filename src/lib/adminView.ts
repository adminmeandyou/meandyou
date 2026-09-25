// src/lib/adminView.ts
// Leitura das views de admin via servidor (api/admin/consulta), com a mesma sintaxe
// encadeada do supabase-js: adminView('admin_users').select('*').eq('plan', 'black').limit(50)
// As views não podem mais ser lidas direto do navegador (expunham dados a qualquer usuário).

type Fonte = 'admin_users' | 'admin_metrics' | 'admin_revenue' | 'admin_signups_daily'
type Resultado<T> = { data: T | null; error: { message: string } | null }

class AdminViewQuery<T = any> implements PromiseLike<Resultado<T>> { // eslint-disable-line @typescript-eslint/no-explicit-any
  private ops: unknown[][] = []
  constructor(private fonte: Fonte) {}

  private add(...op: unknown[]) { this.ops.push(op); return this }
  select(_cols = '*') { return this }
  eq(col: string, v: unknown) { return this.add('eq', col, v) }
  neq(col: string, v: unknown) { return this.add('neq', col, v) }
  gt(col: string, v: unknown) { return this.add('gt', col, v) }
  gte(col: string, v: unknown) { return this.add('gte', col, v) }
  lt(col: string, v: unknown) { return this.add('lt', col, v) }
  lte(col: string, v: unknown) { return this.add('lte', col, v) }
  is(col: string, v: unknown) { return this.add('is', col, v) }
  not(col: string, op: string, v: unknown) { return this.add('not', col, op, v) }
  or(filtro: string) { return this.add('or', filtro) }
  order(col: string, opts?: { ascending?: boolean }) { return this.add('order', col, opts ?? {}) }
  limit(n: number) { return this.add('limit', n) }
  single() { return this.add('single') }

  private async executar(): Promise<Resultado<T>> {
    try {
      const res = await fetch('/api/admin/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fonte: this.fonte, ops: this.ops }),
      })
      const json = await res.json()
      return { data: json.data ?? null, error: json.error ? { message: json.error } : null }
    } catch (e) {
      return { data: null, error: { message: e instanceof Error ? e.message : 'Erro de rede' } }
    }
  }

  then<R1 = Resultado<T>, R2 = never>(
    ok?: ((v: Resultado<T>) => R1 | PromiseLike<R1>) | null,
    fail?: ((e: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.executar().then(ok, fail)
  }
}

export function adminView<T = any>(fonte: Fonte) { // eslint-disable-line @typescript-eslint/no-explicit-any
  return new AdminViewQuery<T>(fonte)
}

// Ações de admin que antes eram RPCs chamadas direto do navegador (qualquer usuário conseguia)
export async function adminAcao(
  acao: 'banir' | 'desbanir' | 'resolver_denuncia',
  dados: { userId?: string; motivo?: string; reportId?: string; resultado?: string },
) {
  const res = await fetch('/api/admin/acao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acao, ...dados }),
  })
  return res.ok
}
