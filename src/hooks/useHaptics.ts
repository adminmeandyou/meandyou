/**
 * useHaptics — vibração tátil via navigator.vibrate
 * Sem efeito em dispositivos que não suportam (iOS Safari, desktop).
 */
export function useHaptics() {
  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(pattern) } catch { /* silencioso */ }
    }
  }

  return {
    /** Tap leve — confirmação, toggle, seleção */
    tap:     () => vibrate(10),
    /** Tap médio — submit, enviar mensagem, curtir */
    medium:  () => vibrate(25),
    /** Sucesso — match, pagamento, verificação */
    success: () => vibrate([15, 40, 15]),
    /** Erro — falha, campo inválido */
    error:   () => vibrate([30, 20, 30]),
    /** Match — padrão especial duplo pulso */
    match:   () => vibrate([20, 60, 80]),
  }
}
