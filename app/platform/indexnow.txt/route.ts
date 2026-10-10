import { INDEXNOW_KEY } from '@/platform/indexnow'

/** torqstudio.com/indexnow.txt — the IndexNow key file (see `platform/indexnow.ts`). */
export function GET() {
  if (!INDEXNOW_KEY) return new Response('Not found', { status: 404 })
  return new Response(INDEXNOW_KEY, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600', 'X-Robots-Tag': 'noindex' },
  })
}
