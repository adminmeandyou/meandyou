'use client'

import { useCountdownStr } from './useCountdownStr'

export function CountdownText({ until }: { until: string }) {
  const str = useCountdownStr(until)
  return <>{str}</>
}
