'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { type Step, TERMS_KEY, G, BG } from './_components/helpers'
import CamaroteBlocked from './_components/CamaroteBlocked'
import CamaroteTerms from './_components/CamaroteTerms'
import CamaroteCategories from './_components/CamaroteCategories'
import CamaroteVitrine from './_components/CamaroteVitrine'

// ─── Página principal ──────────────────────────────────────────────────────────

export default function BackstagePage() {
  const { limits, loading: planLoading } = usePlan()
  const router = useRouter()

  if (planLoading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'rgba(255,255,255,0.2)' }} />
      </div>
    )
  }

  if (!limits.isBlack) {
    return <CamaroteBlocked plan={limits.isPlus ? 'plus' : 'essencial'} onBack={() => router.back()} />
  }

  return <CamaroteApp onBack={() => router.back()} />
}

// ─── App interno (só Black) ────────────────────────────────────────────────────

function CamaroteApp({ onBack }: { onBack: () => void }) {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('loading')
  const [myCategories, setMyCategories] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    init()
  }, [user?.id])

  async function init() {
    const termsOk = localStorage.getItem(TERMS_KEY) === 'accepted'
    if (!termsOk) { setStep('terms'); return }

    const { data } = await supabase
      .from('profiles')
      .select('camarote_interests')
      .eq('id', user!.id)
      .single()

    const cats: string[] = data?.camarote_interests ?? []
    if (cats.length === 0) { setStep('categories'); return }

    setMyCategories(cats)
    setStep('vitrine')
  }

  function handleTermsAccepted() {
    localStorage.setItem(TERMS_KEY, 'accepted')
    setStep('categories')
  }

  async function handleCategoriesSaved(cats: string[]) {
    await supabase
      .from('profiles')
      .update({ camarote_interests: cats })
      .eq('id', user!.id)
    setMyCategories(cats)
    setStep('vitrine')
  }

  if (step === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: G }} />
      </div>
    )
  }

  if (step === 'terms') {
    return <CamaroteTerms onAccept={handleTermsAccepted} onBack={onBack} />
  }

  if (step === 'categories') {
    return <CamaroteCategories initial={myCategories} onSave={handleCategoriesSaved} onBack={onBack} />
  }

  return (
    <CamaroteVitrine
      myCategories={myCategories}
      onChangeCategories={() => setStep('categories')}
      onBack={onBack}
    />
  )
}
