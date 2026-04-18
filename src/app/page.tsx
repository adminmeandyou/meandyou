import LandingClient from './LandingClient'
import { getSiteConfig, getLandingContent } from './landing/server'

export const revalidate = 60

export default async function Home() {
  const [config, content] = await Promise.all([
    getSiteConfig(),
    getLandingContent('oficial'),
  ])

  return <LandingClient config={config} content={content} />
}
