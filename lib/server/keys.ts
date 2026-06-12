import { getFirestore, type Firestore } from "firebase-admin/firestore"
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"
import { getAdminApp } from "./admin"
import { PROVIDERS, type ProviderId } from "../providers"

export type SecretKey = "apiKey" | "baseUrl"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16

function getEncryptionKey(): Buffer {
  const raw = process.env.FIREBASE_PRIVATE_KEY ?? ""
  return createHash("sha256").update(raw).digest()
}

function encryptValue(value: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(value, "utf8", "hex")
  encrypted += cipher.final("hex")
  const authTag = cipher.getAuthTag().toString("hex")
  return iv.toString("hex") + ":" + authTag + ":" + encrypted
}

function decryptValue(encrypted: string): string {
  const key = getEncryptionKey()
  const parts = encrypted.split(":")
  if (parts.length !== 3) return encrypted
  const iv = Buffer.from(parts[0], "hex")
  const authTag = Buffer.from(parts[1], "hex")
  const data = parts[2]
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(data, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

function db(): Firestore {
  return getFirestore(getAdminApp())
}

function docRef(uid: string) {
  return db().collection("users").doc(uid)
}

export async function getSecret(
  uid: string,
  provider: ProviderId,
  key: SecretKey
): Promise<string | null> {
  const snapshot = await docRef(uid).get()
  const data = snapshot.data() as Record<string, unknown> | undefined
  const providerSecrets = (data?.secrets as Record<string, Record<string, string>> | undefined) ?? {}
  const raw = providerSecrets[provider]?.[key] ?? null
  if (!raw) return null
  return decryptValue(raw)
}

export async function setSecret(
  uid: string,
  provider: ProviderId,
  key: SecretKey,
  value: string
): Promise<void> {
  const encrypted = encryptValue(value)
  await docRef(uid).set(
    {
      secrets: {
        [provider]: { [key]: encrypted },
      },
      updatedAt: Date.now(),
    },
    { merge: true }
  )
}

export async function clearSecret(
  uid: string,
  provider: ProviderId,
  key: SecretKey
): Promise<void> {
  await docRef(uid).update({
    [`secrets.${provider}.${key}`]: null as never,
  })
}

export async function listConfiguredProviders(uid: string): Promise<{
  configured: {
    provider: ProviderId
    hasApiKey: boolean
    baseUrl: string | null
  }[]
}> {
  const snapshot = await docRef(uid).get()
  const data = snapshot.data() as Record<string, unknown> | undefined
  const secrets = (data?.secrets as Record<string, Record<string, string>> | undefined) ?? {}
  return {
    configured: (Object.keys(PROVIDERS) as ProviderId[]).map((provider) => ({
      provider,
      hasApiKey: Boolean(secrets[provider]?.apiKey),
      baseUrl: secrets[provider]?.baseUrl ?? null,
    })),
  }
}

export async function getProviderCredentials(
  uid: string,
  provider: ProviderId
): Promise<{ apiKey: string | null; baseUrl: string | null }> {
  return {
    apiKey: await getSecret(uid, provider, "apiKey"),
    baseUrl: await getSecret(uid, provider, "baseUrl"),
  }
}
