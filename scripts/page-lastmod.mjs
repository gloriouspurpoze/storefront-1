#!/usr/bin/env node
/**
 * Records when each marketing-page content file last changed in git, for <lastmod> in
 * torqstudio.com/sitemap.xml (read by `platform/pageLastmod.ts`). Runs before `next build`.
 *
 * Vercel clones shallowly unless VERCEL_DEEP_CLONE=true. In a shallow clone, a file whose
 * last change is older than the clone shows the boundary commit's date instead — those
 * files keep the date already committed in the JSON. This script never fails the build.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const OUT = 'platform/content/page-lastmod.json'
/** Files whose edits change what a marketing page says (keep in sync with platform/pageLastmod.ts). */
const ROOTS = ['app/platform/page.tsx', 'app/platform/pricing/page.tsx', 'app/platform/[slug]/page.tsx', 'platform/content', 'lib/marketing-data']

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
}

function files(path) {
  if (!existsSync(path)) return []
  if (statSync(path).isFile()) return /\.tsx?$/.test(path) ? [path] : []
  return readdirSync(path).flatMap((name) => (name === '__tests__' ? [] : files(join(path, name))))
}

const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {}

try {
  const shallowFile = git(['rev-parse', '--git-path', 'shallow'])
  const boundary = new Set(existsSync(shallowFile) ? readFileSync(shallowFile, 'utf8').split('\n').filter(Boolean) : [])
  const next = {}
  for (const file of ROOTS.flatMap(files)) {
    const key = relative('.', file).split('\\').join('/')
    const [hash, date] = git(['log', '-1', '--format=%H %cI', '--', file]).split(' ')
    if (hash && date && !boundary.has(hash)) next[key] = new Date(date).toISOString()
    else if (previous[key]) next[key] = previous[key]
  }
  const sorted = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)))
  const body = `${JSON.stringify(sorted, null, 2)}\n`
  if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== body) writeFileSync(OUT, body)
  console.log(`page-lastmod: ${Object.keys(sorted).length} files${boundary.size ? ' (shallow clone)' : ''}`)
} catch (err) {
  console.warn(`page-lastmod: git unavailable, keeping ${OUT} as is (${err instanceof Error ? err.message : err})`)
}
