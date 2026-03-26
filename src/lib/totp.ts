// Funções de criptografia AES-256-GCM para secrets TOTP e tokens de sessão
// Usadas pelos endpoints de 2FA (gerar, verificar, ativar, desativar)
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

function getKey(): Buffer {
  return Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 32).padEnd(32, '0'))
}

export function encryptSecret(plain: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted.toString('hex')
}

export function decryptSecret(enc: string): string {
  const [ivHex, tagHex, dataHex] = enc.split(':')
  const key = getKey()
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
