import { getFirestore, type Firestore } from "firebase-admin/firestore"
import { getAdminApp } from "./admin"
import { PROVIDERS, type ProviderId } from "../providers"

export type SecretKey = "apiKey" | "baseUrl"

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
  return providerSecrets[provider]?.[key] ?? null
}

export async function setSecret(
  uid: string,
  provider: ProviderId,
  key: SecretKey,
  value: string
): Promise<void> {
  await docRef(uid).set(
    {
      secrets: {
        [provider]: { [key]: value },
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
