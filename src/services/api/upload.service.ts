import { apiClient } from '../apiClient'

export interface UploadResponse {
  url: string
  publicId: string
  width?: number
  height?: number
  format?: string
  size?: number
}

export interface CloudinaryImageItem {
  url: string
  publicId: string
  width?: number
  height?: number
}

type RawListing = Record<string, unknown>

function readString(raw: RawListing, ...keys: string[]): string {
  for (const key of keys) {
    const v = raw[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function readNumber(raw: RawListing, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = raw[key]
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  return undefined
}

/** Best-effort when API returns URL only (stable keys + delete by public_id) */
function inferPublicIdFromCloudinaryUrl(url: string): string {
  try {
    const u = new URL(url)
    const segments = u.pathname.split('/').filter(Boolean)
    const uploadIdx = segments.indexOf('upload')
    if (uploadIdx === -1) return ''
    const after = segments.slice(uploadIdx + 1)
    if (after[0]?.startsWith('v') && /^v\d+$/i.test(after[0])) after.shift()
    if (after.length === 0) return ''
    const joined = decodeURIComponent(after.join('/'))
    return joined.replace(/\.[^.]+$/, '')
  } catch {
    return ''
  }
}

/** Normalize one row from `/upload/images` or Cloudinary admin-style payloads */
function normalizeCloudinaryImageItem(raw: unknown): CloudinaryImageItem | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as RawListing
  const url = readString(o, 'url', 'secure_url', 'secureUrl')
  let publicId = readString(o, 'publicId', 'public_id')
  if (!publicId && url) publicId = inferPublicIdFromCloudinaryUrl(url)
  if (!url && !publicId) return null
  return {
    url,
    publicId,
    width: readNumber(o, 'width'),
    height: readNumber(o, 'height'),
  }
}

function collectImageArrays(body: unknown): unknown[] | null {
  if (Array.isArray(body)) return body
  if (!body || typeof body !== 'object') return null
  const o = body as RawListing & { data?: unknown }
  const data = o.data
  const nestedArrays = [
    o.images,
    o.resources,
    o.result,
    o.items,
    (data && typeof data === 'object' && !Array.isArray(data) ? (data as RawListing).images : undefined),
    (data && typeof data === 'object' && !Array.isArray(data) ? (data as RawListing).resources : undefined),
    (data && typeof data === 'object' && !Array.isArray(data) ? (data as RawListing).result : undefined),
  ]
  for (const a of nestedArrays) {
    if (Array.isArray(a)) return a
  }
  if (Array.isArray(data)) return data
  return null
}

interface ApiResponse {
  success: boolean
  message?: string
  data?: any
  error?: string
}

/**
 * Upload Service
 * Handles image uploads to Cloudinary via backend
 */
export class UploadService {
  private static isNotFoundError(error: any): boolean {
    const status = error?.status || error?.response?.status
    const message = String(error?.message || '')
    return status === 404 || message.includes('status: 404') || message.includes('404')
  }

  private static extractUploadData(response: any): UploadResponse {
    // Common wrapper: { success, data }
    if (response?.success && response?.data) return response.data as UploadResponse

    // Sometimes wrappers look like: { data: { url, ... } }
    if (response?.data?.url) return response.data as UploadResponse

    // Or direct payload: { url, ... }
    if (response?.url) return response as UploadResponse

    throw new Error(response?.message || 'Upload failed')
  }

  /**
   * List existing images from Cloudinary (for "choose from library").
   */
  static async listImages(folder: string = 'homeservice', limit: number = 50): Promise<CloudinaryImageItem[]> {
    try {
      const params = new URLSearchParams({ folder, limit: String(limit) })
      const response = await apiClient.get<unknown>(
        `/upload/images?${params.toString()}`,
        { showLoading: false, showSuccessToast: false, showErrorToast: false }
      )
      const rawList = collectImageArrays(response)
      if (!rawList) return []
      return rawList
        .map((row) => normalizeCloudinaryImageItem(row))
        .filter((x): x is CloudinaryImageItem => Boolean(x?.url?.trim()))
    } catch (error: any) {
      console.error('List images error:', error)
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to list images')
    }
  }

  /**
   * Upload single image
   */
  static async uploadImage(file: File, folder: string = 'homeservice'): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('image', file)
    // Some backends expect `file` key instead of `image`
    formData.append('file', file)
    formData.append('folder', folder)

    try {
      // Try multiple endpoints (backend versions differ)
      const endpoints = ['/upload/image', '/uploads/image']
      let lastError: any = null

      for (const endpoint of endpoints) {
        try {
          const response = await apiClient.uploadFile<ApiResponse>(endpoint, formData, {
            showLoading: false, // We handle loading in component
            showSuccessToast: false,
            showErrorToast: false,
          })

          return this.extractUploadData(response)
        } catch (err: any) {
          lastError = err
          if (this.isNotFoundError(err)) continue
          throw err
        }
      }

      throw lastError || new Error('Upload failed')
    } catch (error: any) {
      console.error('Upload error:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to upload image')
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadImages(
    files: File[],
    folder: string = 'homeservice'
  ): Promise<UploadResponse[]> {
    const formData = new FormData()
    
    files.forEach((file) => {
      formData.append('images', file)
      // Some backends expect `files`
      formData.append('files', file)
    })
    formData.append('folder', folder)

    try {
      const endpoints = ['/upload/images', '/uploads/images']
      let lastError: any = null

      for (const endpoint of endpoints) {
        try {
          const response = await apiClient.uploadFile<ApiResponse>(endpoint, formData, {
            showLoading: false,
            showSuccessToast: false,
            showErrorToast: false,
          })

          // extractUploadData returns single; for multiple we accept common patterns
          if (response?.success && response?.data) return response.data as UploadResponse[]
          if (Array.isArray(response?.data)) return response.data as UploadResponse[]
          if (Array.isArray(response)) return response as UploadResponse[]

          throw new Error(response?.message || 'Upload failed')
        } catch (err: any) {
          lastError = err
          if (this.isNotFoundError(err)) continue
          throw err
        }
      }

      throw lastError || new Error('Upload failed')
    } catch (error: any) {
      console.error('Multiple upload error:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to upload images')
    }
  }

  /**
   * Delete image
   */
  static async deleteImage(publicId: string): Promise<void> {
    try {
      const endpoints = [`/upload/image?publicId=${publicId}`, `/uploads/image?publicId=${publicId}`]
      let lastError: any = null

      for (const endpoint of endpoints) {
        try {
          const response = await apiClient.delete<ApiResponse>(endpoint, {
            showLoading: false,
            showSuccessToast: false,
            showErrorToast: false,
          })

          if (response?.success) return
          throw new Error(response?.message || 'Delete failed')
        } catch (err: any) {
          lastError = err
          if (this.isNotFoundError(err)) continue
          throw err
        }
      }

      throw lastError || new Error('Delete failed')
    } catch (error: any) {
      console.error('Delete error:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete image')
    }
  }

  /**
   * Convert File to base64 (for preview)
   */
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }
}

export default UploadService

