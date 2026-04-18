import { redirect } from 'next/navigation'
import LancamentoClient from './LancamentoClient'
import { getSiteConfig, getLandingContent } from '../landing/server'

export const revalidate = 60

export default async function LancamentoPage() {
  const [config, content] = await Promise.all([
    getSiteConfig(),
    getLandingContent('lancamento'),
  ])

  if (!config.lancamento_ativo) redirect('/')

  return <LancamentoClient config={config} content={content} />
}
