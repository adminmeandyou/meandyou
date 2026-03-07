'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

async function linkReferral(newUserId: string, refCode: string) {
  if (!refCode) return

  const { data: referrer } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', refCode)
    .single()

  if (!referrer || referrer.id === newUserId) return

  await supabase
    .from('profiles')
    .update({ referred_by: referrer.id })
    .eq('id', newUserId)

  await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referred_id: newUserId,
      status: 'pending',
    })
}

export default function Cadastro() {
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') ?? ''

  const [nomeCompleto, setNomeCompleto] = useState('')
  const [nomeExibicao, setNomeExibicao] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const formatarTelefone = (valor: string) => {
    const nums = valor.replace(/\D/g, '').slice(0, 11)
    if (nums.length <= 2) return nums
    if (nums.length <= 7) return `(${nums.slice(0,2)}) ${nums.slice(2)}`
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`
  }

  const handleCadastro = async () => {
    setLoading(true)
    setErro('')

    if (!nomeCompleto || !nomeExibicao || !telefone || !email || !senha) {
      setErro('Preencha todos os campos')
      setLoading(false)
      return
    }

    if (nomeCompleto.trim().split(' ').length < 2) {
      setErro('Informe seu nome completo (nome e sobrenome)')
      setLoading(false)
      return
    }

    const telefoneLimpo = telefone.replace(/\D/g, '')
    if (telefoneLimpo.length < 10) {
      setErro('Telefone inválido')
      setLoading(false)
      return
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome_completo: nomeCompleto.trim(),
          nome_exibicao: nomeExibicao.trim(),
          telefone: telefoneLimpo,
        }
      }
    })

    if (error) {
      setErro(error.message === 'User already registered' ? 'Este email já está cadastrado.' : error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('users').update({
        phone: telefoneLimpo,
        nome_completo: nomeCompleto.trim(),
      }).eq('id', data.user.id)

      // Vincula indicação se veio de um link de referral
      if (refCode) {
        await linkReferral(data.user.id, refCode)
      }
    }

    setSucesso(true)
    setLoading(false)
  }

  if (sucesso) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', marginBottom: '12px', color: 'var(--text)' }}>
            Conta criada!
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6', marginBottom: '24px' }}>
            Bem-vindo(a) ao MeAndYou, <strong style={{ color: 'var(--text)' }}>{nomeExibicao}</strong>!<br /><br />
            Agora vamos completar seu perfil.
          </p>
          <a href="/perfil" style={{ display: 'block', backgroundColor: 'var(--accent)', color: '#fff', padding: '14px 32px', borderRadius: '100px', textDecoration: 'none', fontWeight: '700', fontSize: '15px' }}>
            Completar perfil
          </a>
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
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Crie sua conta e encontre conexões reais</p>

          {/* Badge de convite */}
          {refCode && (
            <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '6px 14px', borderRadius: '100px' }}>
              🎁 Você foi convidado! Ganhe SuperLikes, Boost e mais ao assinar
            </div>
          )}
        </div>

        <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '24px', padding: '36px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                Nome completo
              </label>
              <input
                type="text"
                placeholder="Seu nome e sobrenome"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
              />
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                Usado apenas para verificação de identidade. Não aparece no perfil.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                Nome na plataforma
              </label>
              <input
                type="text"
                placeholder="Como quer ser chamado(a)"
                value={nomeExibicao}
                onChange={(e) => setNomeExibicao(e.target.value)}
              />
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                Este é o nome que outros usuários vão ver.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                Telefone (WhatsApp)
              </label>
              <input
                type="tel"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
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
              <p style={{ color: 'var(--red)', fontSize: '14px', textAlign: 'center' }}>{erro}</p>
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