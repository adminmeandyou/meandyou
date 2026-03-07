'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setErro('')

    if (!email || !senha) {
      setErro('Preencha todos os campos')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro('Email ou senha incorretos')
    } else {
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: 'var(--bg)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '36px',
            marginBottom: '8px',
            color: 'var(--text)'
          }}>
            MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
            Entre na sua conta
          </p>
        </div>

        <div style={{
          backgroundColor: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                Senha
              </label>
              <input
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              <Link href="/recuperar-senha" style={{ color: 'var(--accent)', fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
                Esqueci minha senha
              </Link>
            </div>

            {erro && (
              <p style={{ color: 'var(--red)', fontSize: '14px', textAlign: 'center' }}>
                {erro}
              </p>
            )}

            <button
              className="btn-primary"
              onClick={handleLogin}
              disabled={loading}
              style={{ marginTop: '8px', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
              Não tem conta?{' '}
              <Link href="/cadastro" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
                Criar conta
              </Link>
            </p>

          </div>
        </div>

      </div>
    </div>
  )
}