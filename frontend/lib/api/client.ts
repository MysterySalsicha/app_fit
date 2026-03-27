/**
 * API Client — HunterFit
 * Wrapper sobre fetch com auth header, retry e tipagem
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

class ApiError extends Error {
  constructor(public status: number, public body: unknown, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('hf_token')
}

export function setToken(token: string) {
  localStorage.setItem('hf_token', token)
  // Setar cookie auxiliar para o middleware Next.js (não acessa localStorage)
  if (typeof document !== 'undefined') {
    document.cookie = `hf_auth=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
  }
}

export function clearToken() {
  localStorage.removeItem('hf_token')
  localStorage.removeItem('hf_user')
  // Remover cookie auxiliar do middleware
  if (typeof document !== 'undefined') {
    document.cookie = 'hf_auth=; path=/; max-age=0; SameSite=Lax'
  }
}

// Permite enviar body em DELETE (ex: unsubscribe de push)
export const apiRaw = {
  deleteWithBody: <T>(path: string, body: unknown) =>
    request<T>('DELETE', path, body),
}

// Timeout padrão de 30 segundos — evita que requests pendurem indefinidamente
const REQUEST_TIMEOUT_MS = 30_000

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: { auth?: boolean; formData?: boolean } = {}
): Promise<T> {
  const { auth = true } = opts

  const headers: Record<string, string> = {}

  if (body && !opts.formData) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  // Send timezone offset so the server can compute the correct local date/day-of-week.
  // getTimezoneOffset() returns minutes WEST of UTC (negative for Brazil, etc.)
  // We invert the sign so positive = ahead of UTC (e.g., BRT = UTC-3 → +180 minutes offset from server POV is wrong)
  // We send the raw value and let the server subtract: utcNow + offset_minutes → local time
  if (typeof window !== 'undefined') {
    headers['X-Timezone-Offset'] = String(-new Date().getTimezoneOffset())
  }

  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/${path.replace(/^\//, '')}`, {
      method,
      headers,
      body: body
        ? opts.formData
          ? (body as FormData)
          : JSON.stringify(body)
        : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new ApiError(0, null, `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data,
      data?.error ?? data?.message ?? `HTTP ${res.status}`
    )
  }

  return data as T
}

export const api = {
  get:    <T>(path: string) => request<T>('GET', path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put:    <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch:  <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  postPublic: <T>(path: string, body?: unknown) =>
    request<T>('POST', path, body, { auth: false }),
}

export { ApiError }
