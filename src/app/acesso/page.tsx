import { redirect } from 'next/navigation'
import { getSiteConfig } from '@/app/landing/server'
import AcessoClient from './AcessoClient'

export const revalidate = 60

export default async function AcessoPage() {
  const config = await getSiteConfig()

  if (!config.gate_ativo) {
    redirect('/')
  }

  return (
    <AcessoClient
      titulo={config.gate_titulo}
      mensagem={config.gate_mensagem}
    />
  )
}
