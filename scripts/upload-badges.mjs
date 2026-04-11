import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BADGES_DIR = join(__dirname, '../public/badges/feitos')
const BUCKET = 'badge-images'

const supabase = createClient(
  'https://akignnxgjyryqcgxesqn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFraWdubnhnanlyeXFjZ3hlc3FuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgyMDQzMSwiZXhwIjoyMDg4Mzk2NDMxfQ.rDv6ColeBlumfvo9B-0aPQk3T5T0fbB2ri-ytHczaPo'
)

// Mapeamento: nome do arquivo em feitos/ → nome no Storage
const MAP = {
  'aovivo.png':           'badge-ao-vivo.png',
  'atraente.png':         'badge-atraente.png',
  'aventuraon.png':       'badge-aventura-on.png',
  'bemvindo.png':         'badge-bem-vindo.png',
  'bocaaboca.png':        'badge-boca-a-boca.png',
  'caraacara.png':        'badge-cara-a-cara.png',
  'celebridade.png':      'badge-celebridade.png',
  'classes.png':          'badge-classe-s.png',
  'comprador.png':        'badge-comprador.png',
  'dacasa.png':           'badge-da-casa.png',
  'dedicado.png':         'badge-dedicado.png',
  'deolho.png':           'badge-de-olho.png',
  'desejavel.png':        'badge-desejavel.png',
  'desenrola.png':        'badge-desenrola.png',
  'Destaque.png':         'badge-destaque.png',
  'diferente.png':        'badge-diferente.png',
  'Dominante.png':        'badge-dominante.png',
  'Elite Black.png':      'badge-elite-black.png',
  'famoso.png':           'badge-famoso.png',
  'Forever.png':          'badge-forever.png',
  'galeriarica.png':      'badge-galeria-rica.png',
  'glitch.png':           'badge-glitch.png',
  'hipnotiza.png':        'badge-hipnotiza.png',
  'hospede.png':          'badge-hospede.png',
  'imasocial.png':        'badge-ima-social.png',
  'Imperium.png':         'badge-imperium.png',
  'influencia.png':       'badge-influencia.png',
  'Inigualável.png':      'badge-inigualavel.png',
  'investidor.png':       'badge-investidor.png',
  'irresistivel.png':     'badge-irresistivel.png',
  'lendaurbana.png':      'badge-lenda-urbana.png',
  'magnata.png':          'badge-magnata.png',
  'matraca.png':          'badge-matraca.png',
  'meliga.png':           'badge-me-liga.png',
  'muitoquente.png':      'badge-muito-quente.png',
  'naofalha.png':         'badge-nao-falha.png',
  'napista.png':          'badge-na-pista.png',
  'nivel999.png':         'badge-nivel-999.png',
  'olhononolho.png':      'badge-olho-no-olho.png',
  'Onipresente.png':      'badge-onipresente.png',
  'papo solto.png':       'badge-papo-solto.png',
  'patrimonio.png':       'badge-patrimonio.png',
  'pontual.png':          'badge-pontual.png',
  'presente.png':         'badge-presente.png',
  'realitystar.png':      'badge-reality-star.png',
  'relatocorajoso.png':   'badge-relato-corajoso.png',
  'royalty.png':          'badge-royalty.png',
  'semfreio.png':         'badge-sem-freio.png',
  'tentacao.png':         'badge-tentacao.png',
  'tequiero.png':         'badge-te-quiero.png',
  'umamaquina.png':       'badge-uma-maquina.png',
  'vibeboa.png':          'badge-vibe-boa.png',
  'visita.png':           'badge-visita.png',
}

const files = readdirSync(BADGES_DIR).filter(f => f.endsWith('.png'))
let ok = 0, skip = 0, fail = 0

for (const file of files) {
  const storageName = MAP[file]
  if (!storageName) {
    console.log(`⏭  Sem mapeamento: ${file}`)
    skip++
    continue
  }

  const buffer = readFileSync(join(BADGES_DIR, file))
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageName, buffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) {
    console.error(`❌ ${file} → ${storageName}: ${error.message}`)
    fail++
  } else {
    console.log(`✅ ${file} → ${storageName}`)
    ok++
  }
}

console.log(`\nFinalizado: ${ok} enviados, ${skip} sem mapeamento, ${fail} erros`)
