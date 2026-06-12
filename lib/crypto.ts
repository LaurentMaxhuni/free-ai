const KEY_ITERATIONS = 600_000
const IV_LENGTH = 12
const APP_PEPPER = "free-ai-v1"

function buf2b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function b642buf(str: string): ArrayBuffer {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0)).buffer
}

function getSalt(): string {
  const key = "free-ai:crypto-salt"
  let salt = sessionStorage.getItem(key)
  if (salt) return salt
  salt = crypto.randomUUID()
  try { sessionStorage.setItem(key, salt) } catch {}
  return salt
}

async function deriveKey(uid: string, passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const salt = enc.encode(getSalt() + uid.slice(0, 8))
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(uid + APP_PEPPER + passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  )
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: KEY_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

export function getPassphrase(): string {
  try { return sessionStorage.getItem("free-ai:passphrase") ?? "" } catch { return "" }
}

export function setPassphrase(p: string) {
  try { sessionStorage.setItem("free-ai:passphrase", p) } catch {}
}

const keyCache = new Map<string, CryptoKey>()

async function getCachedKey(uid: string): Promise<CryptoKey> {
  const cacheKey = uid + ":" + (getPassphrase() ? "pass" : "nopass")
  const cached = keyCache.get(cacheKey)
  if (cached) return cached
  const key = await deriveKey(uid, getPassphrase())
  keyCache.set(cacheKey, key)
  return key
}

export async function encrypt(plaintext: string, uid: string): Promise<string> {
  if (typeof window === "undefined" || !crypto?.subtle) return plaintext
  const key = await getCachedKey(uid)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  )
  const out = new Uint8Array(IV_LENGTH + encrypted.byteLength)
  out.set(iv, 0)
  out.set(new Uint8Array(encrypted), IV_LENGTH)
  return buf2b64(out.buffer)
}

export async function decrypt(ciphertext: string, uid: string): Promise<string> {
  if (typeof window === "undefined" || !crypto?.subtle) return ciphertext
  const key = await getCachedKey(uid)
  const combined = b642buf(ciphertext)
  const iv = new Uint8Array(combined.slice(0, IV_LENGTH))
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    combined.slice(IV_LENGTH)
  )
  return new TextDecoder().decode(decrypted)
}

export async function tryEncrypt(data: string, uid: string): Promise<string> {
  try { return await encrypt(data, uid) } catch { return data }
}

export async function tryDecrypt(data: string, uid: string): Promise<string> {
  try { return await decrypt(data, uid) } catch { return data }
}
