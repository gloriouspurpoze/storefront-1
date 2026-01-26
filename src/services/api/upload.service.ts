import { apiClient } from '../apiClient'

export interface UploadResponse {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  size: number
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

