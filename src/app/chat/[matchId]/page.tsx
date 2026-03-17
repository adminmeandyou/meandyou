'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// Redireciona para a página canônica de chat em /conversas/[id]
export default function ChatRedirect() {
  const params = useParams()
  const matchId = params.matchId as string
  const router = useRouter()

  useEffect(() => {
    router.replace(`/conversas/${matchId}`)
  }, [matchId])

  return null
}
