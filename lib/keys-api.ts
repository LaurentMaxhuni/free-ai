import { auth } from "./firebase"
import { PROVIDERS, type ProviderId } from "./providers"

export type ConfiguredProvider = {
  provider: ProviderId
  hasApiKey: boolean
  baseUrl: string | null
}

async function getIdToken(): Promise<string> {
  if (!auth?.currentUser) {
    throw new Error("Not signed in.")
  }
  return auth.currentUser.getIdToken()
}

async function authed<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getIdToken()
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const message = typeof data?.error === "string" ? data.error : `Request failed (${response.status})`
    throw new Error(message)
  }
  return (await response.json()) as T
}

export async function listConfiguredKeys(): Promise<ConfiguredProvider[]> {
  const data = await authed<{ configured: ConfiguredProvider[] }>("/api/keys", {
    method: "GET",
  })
  return data.configured
}

export async function setProviderKey(
  provider: ProviderId,
  fields: { apiKey?: string; baseUrl?: string }
): Promise<void> {
  await authed("/api/keys", {
    method: "POST",
    body: JSON.stringify({ provider, ...fields }),
  })
}

export async function clearProviderKey(provider: ProviderId): Promise<void> {
  await authed(`/api/keys/${PROVIDERS[provider].id}`, {
    method: "DELETE",
  })
}
