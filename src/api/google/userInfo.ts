import { AuthError } from '@/api/google/errors'
import type { IUser } from '@/models/user'

const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo'

interface IGoogleUserInfoResponse {
  sub: string
  name?: string
  email?: string
  picture?: string
}

/** Resolves the signed-in Google account behind an access token. */
export async function fetchGoogleUser(accessToken: string): Promise<IUser> {
  let response: Response

  try {
    response = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch {
    throw new AuthError('profileUnavailable', `Could not reach ${USERINFO_ENDPOINT}`)
  }

  if (!response.ok) {
    throw new AuthError('profileUnavailable', `Google userinfo responded with ${String(response.status)}`)
  }

  const profile = (await response.json()) as IGoogleUserInfoResponse

  return {
    id: profile.sub,
    name: profile.name ?? profile.email ?? '',
    email: profile.email ?? '',
    pictureUrl: profile.picture,
  }
}
