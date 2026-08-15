const KEY_ITERATIONS = 600_000
const IV_LENGTH = 12
const SALT_LENGTH = 16
const APP_PEPPER = "free-ai-v1"
const CRYPTO_VERSION = "v2"
const LEGACY_SALT_KEY = "free-ai:crypto-salt"
const PASSPHRASE_KEY = "free-ai:passphrase"

function bytesToBase64(bytes: Uint8Array): string {
  // Spreading a large Uint8Array into String.fromCharCode can overflow the
  // call stack. Chunking also keeps local chat encryption safe for large chats.
  let binary = ""
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

function bufferToBase64(buffer: ArrayBuffer): string {
  return bytesToBase64(new Uint8Array(buffer))
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

function getLegacySalt(): string {
  // This is only used to read ciphertext produced before v2. New ciphertext
  // carries its salt with it and never depends on browser session state.
  try {
    return (
      window.localStorage.getItem(LEGACY_SALT_KEY) ??
      window.sessionStorage.getItem(LEGACY_SALT_KEY) ??
      ""
    )
  } catch {
    return ""
  }
}

function getLegacySaltOrStableFallback(uid: string): string {
  return getLegacySalt() || `free-ai-legacy:${uid}`
}

async function getStableSalt(uid: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${APP_PEPPER}:salt:${uid}`)
  )
  return new Uint8Array(digest).slice(0, SALT_LENGTH)
}

async function deriveKey(
  uid: string,
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const saltBuffer = new Uint8Array(salt).buffer as ArrayBuffer
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(uid + APP_PEPPER + passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  )
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBuffer, iterations: KEY_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

export function getPassphrase(): string {
  try {
    return (
      window.localStorage.getItem(PASSPHRASE_KEY) ??
      window.sessionStorage.getItem(PASSPHRASE_KEY) ??
      ""
    )
  } catch {
    return ""
  }
}

export function setPassphrase(passphrase: string): void {
  try {
    window.localStorage.setItem(PASSPHRASE_KEY, passphrase)
    window.sessionStorage.removeItem(PASSPHRASE_KEY)
  } catch {
    /* storage may be disabled */
  }
}

const keyCache = new Map<string, Promise<CryptoKey>>()

function getCachedKey(
  uid: string,
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const saltKey = bufferToBase64(salt.buffer as ArrayBuffer)
  const cacheKey = `${uid}:${passphrase ? "pass" : "nopass"}:${saltKey}`
  const cached = keyCache.get(cacheKey)
  if (cached) return cached
  const key = deriveKey(uid, passphrase, salt)
  keyCache.set(cacheKey, key)
  return key
}

function isV2Ciphertext(value: string): boolean {
  return value.startsWith(`${CRYPTO_VERSION}.`)
}

export function isPortableCiphertext(value: string): boolean {
  return isV2Ciphertext(value)
}

export async function encrypt(plaintext: string, uid: string): Promise<string> {
  if (typeof window === "undefined" || !globalThis.crypto?.subtle) return plaintext

  // The salt is stable per account and included in the envelope. AES-GCM's
  // random IV still makes every ciphertext unique, while the stable salt keeps
  // PBKDF2 key derivation cacheable and portable across devices.
  const salt = await getStableSalt(uid)
  const key = await getCachedKey(uid, getPassphrase(), salt)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  )
  const payload = new Uint8Array(IV_LENGTH + encrypted.byteLength)
  payload.set(iv, 0)
  payload.set(new Uint8Array(encrypted), IV_LENGTH)

  // The salt is not secret. Including it in the envelope makes ciphertext
  // portable across tabs and devices without relying on sessionStorage.
  return `${CRYPTO_VERSION}.${bufferToBase64(salt.buffer as ArrayBuffer)}.${bufferToBase64(payload.buffer as ArrayBuffer)}`
}

export async function decrypt(ciphertext: string, uid: string): Promise<string> {
  if (typeof window === "undefined" || !globalThis.crypto?.subtle) return ciphertext

  let salt: Uint8Array
  let combined: Uint8Array

  if (isV2Ciphertext(ciphertext)) {
    const [, encodedSalt, encodedPayload] = ciphertext.split(".")
    if (!encodedSalt || !encodedPayload) throw new Error("Invalid encrypted chat")
    salt = base64ToBytes(encodedSalt)
    combined = base64ToBytes(encodedPayload)
    if (salt.length !== SALT_LENGTH || combined.length <= IV_LENGTH) {
      throw new Error("Invalid encrypted chat")
    }
  } else {
    // Backward-compatible read path for the old format. Existing ciphertext
    // will continue to work in browsers that still have its legacy salt.
    const enc = new TextEncoder()
    salt = enc.encode(getLegacySaltOrStableFallback(uid) + uid.slice(0, 8))
    combined = base64ToBytes(ciphertext)
    if (combined.length <= IV_LENGTH) throw new Error("Invalid encrypted chat")
  }

  const key = await getCachedKey(uid, getPassphrase(), salt)
  const iv = combined.slice(0, IV_LENGTH)
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    combined.slice(IV_LENGTH)
  )
  return new TextDecoder().decode(decrypted)
}

export async function tryEncrypt(data: string, uid: string): Promise<string> {
  try {
    return await encrypt(data, uid)
  } catch {
    return data
  }
}

export async function tryDecrypt(data: string, uid: string): Promise<string> {
  try {
    return await decrypt(data, uid)
  } catch {
    return data
  }
}
