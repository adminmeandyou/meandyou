'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function NovaSenha() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (!token) {
      router.push('/recuperar-senha')
    }
  }, [token])

  const handleRedefinir = async () => {
    setLoading(true)
    setErro('')

    if (!senha || !confirmar) {
      setErro('Preencha todos os campos')
      setLoading(false)
      return
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    if (senha !== confirmar) {
      setErro('As senhas não coincidem')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/nova-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, senha }),
    })

    const data = await res.json()

    if (!res.ok) {
      setErro(data.error || 'Erro ao redefinir senha')
    } else {
      setSucesso(true)
      setTimeout(() => router.push('/login'), 3000)
    }

    setLoading(false)
  }

  if (sucesso) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', marginBottom: '12px', color: 'var(--text)' }}>
            Senha redefinida!
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
            Sua senha foi alterada com sucesso. Redirecionando para o login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '36px', marginBottom: '8px', color: 'var(--text)' }}>
            MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Crie uma nova senha</p>
        </div>
        <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '24px', padding: '36px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                Nova senha
              </label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                Confirmar senha
              </label>
              <input
                type="password"
                placeholder="Repita a senha"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
              />
            </div>
            {erro && <p style={{ color: 'var(--red)', fontSize: '14px', textAlign: 'center' }}>{erro}</p>}
            <button
              className="btn-primary"
              onClick={handleRedefinir}
              disabled={loading}
              style={{ marginTop: '8px', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}