import crypto from 'node:crypto'

const ALG = 'sha256'

export type DownloadTokenPayload = {
  type: 'bootstrap' | 'container'
  gameId: string
  containerId?: string
  exp: number // epoch seconds
}

function getSecret(): string {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret'
  return secret
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function signToken(payload: DownloadTokenPayload): string {
  const header = { alg: 'HS256', typ: 'DLT' }
  const h = base64url(JSON.stringify(header))
  const p = base64url(JSON.stringify(payload))
  const data = `${h}.${p}`
  const sig = crypto.createHmac(ALG, getSecret()).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyToken(token: string): DownloadTokenPayload | null {
  try {
    const [h, p, s] = token.split('.')
    if (!h || !p || !s) return null
    const data = `${h}.${p}`
    const sig = crypto.createHmac(ALG, getSecret()).update(data).digest('base64url')
    if (sig !== s) return null
    const json = JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString())
    if (typeof json.exp !== 'number' || json.exp < Math.floor(Date.now() / 1000)) return null
    return json as DownloadTokenPayload
  } catch {
    return null
  }
}


