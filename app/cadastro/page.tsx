'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function Cadastro() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const handleCadastro = async () => {
    setLoading(true)
    setErro('')

    if (!nome || !email || !senha) {
      setErro('Preencha todos os campos')
      setLoading(false)
      return
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { name: nome }
      }
    })

    if (error) {
      setErro(error.message)
    } else {
      setSucesso(true)
    }

    setLoading(false)
  }

  if (sucesso) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'var(--bg)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', marginBottom: '12px', color: 'var(--text)' }}>
            Cadastro realizado!
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
            Enviamos um email de confirmação para <strong style={{ color: 'var(--text)' }}>{email}</strong>.
            Acesse sua caixa de entrada e confirme seu cadastro.
          </p>
        </div>
      </div>
    )
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
            Crie sua conta e encontre conexões reais
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
                Nome
              </label>
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            {erro && (
              <p style={{ color: 'var(--red)', fontSize: '14px', textAlign: 'center' }}>
                {erro}
              </p>
            )}

            <button
              className="btn-primary"
              onClick={handleCadastro}
              disabled={loading}
              style={{ marginTop: '8px', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
              Já tem conta?{' '}
              <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
                Entrar
              </Link>
            </p>

          </div>
        </div>

      </div>
    </div>
  )
}