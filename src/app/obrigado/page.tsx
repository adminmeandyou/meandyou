import { getSiteConfig } from '@/app/landing/server'
import ObrigadoClient from './ObrigadoClient'

export const revalidate = 60

export default async function ObrigadoPage() {
  const config = await getSiteConfig()
  return <ObrigadoClient config={config} />
}
