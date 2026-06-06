import { getAuth, type DecodedIdToken } from "firebase-admin/auth"
import { getAdminApp } from "./admin"

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.name = "AuthError"
    this.status = status
  }
}

export async function verifyRequest(
  request: Request
): Promise<DecodedIdToken> {
  const header = request.headers.get("Authorization")
  if (!header || !header.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid Authorization header")
  }
  const token = header.slice("Bearer ".length).trim()
  if (!token) {
    throw new AuthError("Empty Authorization token")
  }
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(token)
    return decoded
  } catch (err) {
    throw new AuthError(
      `Failed to verify ID token: ${err instanceof Error ? err.message : "unknown error"}`
    )
  }
}
