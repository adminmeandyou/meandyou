'use client'

import { useState, useRef, useEffect } from 'react'

type Category = {
  id: string
  icon: string
  label: string
  emojis: string[]
}

const CATEGORIES: Category[] = [
  {
    id: 'recents',
    icon: '🕐',
    label: 'Recentes',
    emojis: [],
  },
  {
    id: 'smileys',
    icon: '😀',
    label: 'Smileys',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚',
      '😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🫣','🤫','🤔','🫡','🤐','🤨','😐','😑','😶',
      '🫥','😏','😒','🙄','😬','😮‍💨','🤥','🫨','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧',
      '🥵','🥶','🥴','😵','😵‍💫','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','☹️','😮','😯','😲',
      '😳','🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡',
      '😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽',
      '🙀','😿','😾','🙈','🙉','🙊','💋','💌','💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️‍🔥','❤️‍🩹',
      '❤️','🧡','💛','💚','💙','🩵','💜','🤎','🖤','🩶','🤍','💯','💢','💥','💫','💦','💨','💬','💭','💤',
    ],
  },
  {
    id: 'gestures',
    icon: '👋',
    label: 'Gestos',
    emojis: [
      '👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','🫷','🫸','👌','🤌','🤏','✌️','🤞','🫰',
      '🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐',
      '🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','👀',
      '👁️','👅','👄','🫦','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆',
    ],
  },
  {
    id: 'nature',
    icon: '🐶',
    label: 'Natureza',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊',
      '🐒','🐔','🐧','🐦','🐤','🐣','🐥','🪿','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋',
      '🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🕸️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🪼','🦐',
      '🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏',
      '🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🐈','🐈‍⬛','🐇',
      '🐾','🐉','🌵','🎄','🌲','🌳','🌴','🌱','🌿','☘️','🍀','🪴','🍃','🍂','🍁',
      '🍄','🐚','🌾','💐','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌙','🌎','🌍',
      '🌏','🪐','💫','⭐','🌟','✨','⚡','☄️','🔥','🌪️','🌈',
      '☀️','🌤️','⛅','🌥️','☁️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💧','💦','🫧','☔',
    ],
  },
  {
    id: 'food',
    icon: '🍎',
    label: 'Comida',
    emojis: [
      '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆',
      '🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀',
      '🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🥙','🧆','🌮','🌯',
      '🥗','🥘','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠',
      '🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜',
      '🍯','🥛','🍼','🫖','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾',
      '🧊','🥄','🍴','🍽️','🥢',
    ],
  },
  {
    id: 'activities',
    icon: '⚽',
    label: 'Atividades',
    emojis: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🏑','🥍','🏏','🥅','⛳',
      '🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️',
      '🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️',
      '🎫','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻',
      '🎲','♟️','🎯','🎳','🎮','🎰','🧩',
    ],
  },
  {
    id: 'travel',
    icon: '🚗',
    label: 'Viagens',
    emojis: [
      '🚗','🚕','🚙','🚌','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🏍️','🛺','🚲','🛴',
      '🚁','🛸','✈️','🛩️','🛫','🛬','💺','🚀','🛰️','🚢','⛵','🚤','🛥️','🛳️',
      '🚂','🚆','🚇','🚊','🚉','🚝','🗺️','🗿','🗽','🗼','🏰','🏯','🏟️','🎡',
      '🎢','🎠','⛲','🏖️','🏝️','🏜️','🌋','⛰️','🏔️','🗻','🏕️','⛺','🏠','🏡','🏗️','🏢',
      '🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛️','⛪','🕌','🕍','🛕',
      '🎑','🏞️','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙️','🌃','🌌','🌉','🌁',
    ],
  },
  {
    id: 'objects',
    icon: '💡',
    label: 'Objetos',
    emojis: [
      '⌚','📱','💻','⌨️','🖥️','🖨️','🕹️','💽','💾','💿','📀','📷','📸','📹','🎥',
      '📞','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋',
      '🔌','💡','🔦','🕯️','🧯','💸','💵','💴','💶','💷','🪙','💰','💳','🪪','💎','⚖️',
      '🧰','🔧','🔨','🛠️','⛏️','🔩','⚙️','🔫','💣','🔪','🗡️',
      '⚔️','🛡️','🔮','📿','🧿','💈','🔭','🔬','🩹','🩺','💊',
      '💉','🧬','🌡️','🧹','🧺','🧻','🚽','🚰','🚿','🛁','🧼','🪥','🪒',
      '🧽','🧴','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🧸','🖼️','🛍️','🛒','🎁','🎈',
      '🎀','🪄','🪅','🪩','🎊','🎉','🏮','🧧','✉️','📩','📧','💌','📦','🏷️',
      '📜','📄','🧾','📊','📈','📉','📆','📅','📋','📁','📂','📰','📓','📕','📗','📘','📙','📚','📖','🔖','🔗',
    ],
  },
  {
    id: 'symbols',
    icon: '❤️',
    label: 'Simbolos',
    emojis: [
      '❤️','🧡','💛','💚','💙','🩵','💜','🖤','🩶','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💖','💗','💓','💞','💕','💟',
      '❣️','💝','💘','💌','💋','💯','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉',
      '♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','☢️','☣️',
      '✴️','🆚','💮','✅','❌','⭕','🛑',
      '⛔','🚫','❗','❕','❓','❔','‼️','⁉️',
      '⚠️','🚸','♻️','🈯','❇️','✳️','❎','🌐','💠',
      '🔤','🔡','🔠','🆗','🆙','🆒','🆕','🆓',
      '▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','◀️','➡️',
      '⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','🔄',
      '➕','➖','➗','✖️','♾️','💲','™️','©️','®️',
      '✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤',
      '🔔','🔕','📣','📢','♠️','♣️','♥️','♦️','🃏','🎴',
    ],
  },
  {
    id: 'flags',
    icon: '🇧🇷',
    label: 'Bandeiras',
    emojis: [
      '🇧🇷','🇵🇹','🇺🇸','🇬🇧','🇨🇦','🇪🇸','🇫🇷','🇮🇹','🇩🇪','🇯🇵','🇨🇳','🇰🇷',
      '🇷🇺','🇲🇽','🇦🇷','🇨🇱','🇨🇴','🇵🇪','🇺🇾','🇵🇾','🇧🇴','🇻🇪','🇪🇨','🇨🇺','🇳🇱','🇧🇪','🇨🇭','🇸🇪','🇳🇴','🇩🇰','🇫🇮','🇮🇸',
      '🇮🇪','🇦🇹','🇵🇱','🇬🇷','🇹🇷','🇺🇦','🇮🇳','🇦🇺','🇳🇿','🇿🇦','🇪🇬','🇸🇦','🇦🇪','🇮🇱','🇲🇦','🇳🇬','🇰🇪','🇹🇭','🇻🇳','🇮🇩',
      '🇵🇭','🇲🇾','🇸🇬','🇵🇰','🇧🇩','🇶🇦','🇮🇷','🇮🇶','🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️',
    ],
  },
]

const RECENTS_KEY = 'meandyou_emoji_recents'
const MAX_RECENTS = 32

function getRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]')
  } catch { return [] }
}

function addRecent(emoji: string) {
  try {
    const list = getRecents().filter(e => e !== emoji)
    list.unshift(emoji)
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)))
  } catch { /* */ }
}

export function EmojiPicker({ onPick }: {
  onPick: (emoji: string) => void
  onClose?: () => void
}) {
  const [activeCat, setActiveCat] = useState('recents')
  const [recents, setRecents] = useState<string[]>(() => getRecents())
  const gridRef = useRef<HTMLDivElement>(null)

  // Resolve a categoria ativa (recents usa dados do localStorage)
  const currentCat = CATEGORIES.find(c => c.id === activeCat) ?? CATEGORIES[0]
  const emojisToShow = activeCat === 'recents'
    ? (recents.length > 0 ? recents : CATEGORIES[1].emojis.slice(0, 32))
    : currentCat.emojis

  function handlePick(emoji: string) {
    onPick(emoji)
    addRecent(emoji)
    setRecents(getRecents())
  }

  // Scroll o grid pro topo ao trocar de categoria
  useEffect(() => {
    if (gridRef.current) gridRef.current.scrollTop = 0
  }, [activeCat])

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 16,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: 260,
    }}>
      {/* ── Barra de categorias ── */}
      <div style={{
        display: 'flex',
        padding: '0 4px',
        height: 42,
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.15)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {CATEGORIES.map(cat => {
          const isActive = activeCat === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              title={cat.label}
              style={{
                flexShrink: 0,
                width: 40,
                height: 42,
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                background: 'transparent',
                fontSize: 17,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isActive ? 1 : 0.5,
                transition: 'opacity 0.15s',
              }}
            >
              {cat.icon}
            </button>
          )
        })}
      </div>

      {/* ── Label da categoria ── */}
      <div style={{
        padding: '8px 12px 4px',
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--muted-2)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        flexShrink: 0,
        fontFamily: 'var(--font-jakarta)',
      }}>
        {activeCat === 'recents' && recents.length === 0 ? 'Mais usados' : currentCat.label}
      </div>

      {/* ── Grid de emojis ── */}
      <div
        ref={gridRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '0 8px 8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 0,
          alignContent: 'start',
          scrollbarWidth: 'none',
        }}
      >
        {emojisToShow.map((e, i) => (
          <button
            key={`${activeCat}-${i}`}
            onClick={() => handlePick(e)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              width: '100%',
              aspectRatio: '1',
              cursor: 'pointer',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              padding: 0,
            }}
            onTouchStart={(ev) => (ev.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onTouchEnd={(ev) => (ev.currentTarget.style.background = 'none')}
            onMouseEnter={(ev) => (ev.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={(ev) => (ev.currentTarget.style.background = 'none')}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}
