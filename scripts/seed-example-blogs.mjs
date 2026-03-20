#!/usr/bin/env node
/**
 * Seeds 3 example blog posts via the CMS admin API (same contract as fixer-admin BlogService).
 *
 * Usage:
 *   SEED_AUTH_TOKEN="your_jwt" node scripts/seed-example-blogs.mjs
 *   npm run seed:blogs
 *
 * Optional env:
 *   SEED_API_URL  — default http://localhost:5000/api
 */

import axios from 'axios'
import { exampleBlogSeeds } from './blog-seed-posts.mjs'

const API_BASE = process.env.SEED_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
const token = process.env.SEED_AUTH_TOKEN || process.env.AUTH_TOKEN

function mapPayloadToBackend(payload) {
  const { scheduledPublishAt, isFeatured, allowComments, ...rest } = payload
  return {
    ...rest,
    settings: {
      allowComments: allowComments ?? true,
      isFeatured: isFeatured ?? false,
    },
    ...(scheduledPublishAt ? { scheduledFor: scheduledPublishAt } : {}),
  }
}

async function main() {
  if (!token) {
    console.error(`
Missing SEED_AUTH_TOKEN (or AUTH_TOKEN).

1. Log into fixer-admin in the browser.
2. Open DevTools → Application → Local Storage → copy the value of "token".
3. Run:

   SEED_AUTH_TOKEN="paste_jwt_here" npm run seed:blogs
`)
    process.exit(1)
  }

  const url = `${API_BASE.replace(/\/$/, '')}/cms/admin/blogs`
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  console.log(`API: ${url}`)

  for (const post of exampleBlogSeeds) {
    const body = mapPayloadToBackend(post)
    try {
      const res = await axios.post(url, body, { headers, validateStatus: () => true })
      if (res.status >= 200 && res.status < 300) {
        console.log(`✓ Created: "${post.title}" (${post.slug})`)
        continue
      }
      const msg = res.data?.error || res.data?.message || JSON.stringify(res.data)
      if (res.status === 409 || /duplicate|exists|slug/i.test(String(msg))) {
        console.log(`○ Skipped (likely exists): "${post.slug}" — ${msg}`)
        continue
      }
      console.error(`✗ Failed: "${post.slug}" [${res.status}] ${msg}`)
    } catch (e) {
      console.error(`✗ Error: "${post.slug}"`, e.response?.data || e.message)
    }
  }

  console.log('\nDone. Open /cms/blogs in the admin app to review.')
}

main()
