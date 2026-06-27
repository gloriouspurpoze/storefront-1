import { promises as fs } from 'fs'
import path from 'path'
import type { QrCodeRecord } from '@profixer/utils'
import { normalizePublicCode } from '@profixer/utils'

const DATA_DIR = path.join(process.cwd(), '.qr-data')

async function filePath(tenantId: string): Promise<string> {
  const safe = tenantId.replace(/[^a-zA-Z0-9-]/g, '')
  await fs.mkdir(DATA_DIR, { recursive: true })
  return path.join(DATA_DIR, `${safe}.json`)
}

export async function readQrRegistry(tenantId: string): Promise<QrCodeRecord[]> {
  try {
    const raw = await fs.readFile(await filePath(tenantId), 'utf8')
    const parsed = JSON.parse(raw) as QrCodeRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function writeQrRegistry(tenantId: string, codes: QrCodeRecord[]): Promise<void> {
  await fs.writeFile(await filePath(tenantId), JSON.stringify(codes, null, 2), 'utf8')
}

export async function findQrInRegistry(
  tenantId: string,
  publicCode: string,
): Promise<QrCodeRecord | null> {
  const code = normalizePublicCode(publicCode)
  const rows = await readQrRegistry(tenantId)
  return rows.find((r) => r.publicCode === code) ?? null
}

export async function incrementScanInRegistry(
  tenantId: string,
  publicCode: string,
): Promise<void> {
  const code = normalizePublicCode(publicCode)
  const rows = await readQrRegistry(tenantId)
  const idx = rows.findIndex((r) => r.publicCode === code)
  if (idx < 0) return
  rows[idx] = {
    ...rows[idx]!,
    scanCount: (rows[idx]!.scanCount ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  }
  await writeQrRegistry(tenantId, rows)
}
