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
  /**
   * Upload single image
   */
  static async uploadImage(file: File, folder: string = 'homeservice'): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('folder', folder)

    try {
      // Use uploadFile method instead of post to handle FormData properly
      const response = await apiClient.uploadFile<ApiResponse>('/upload/image', formData, {
        showLoading: false, // We handle loading in component
        showSuccessToast: false,
        showErrorToast: false,
      })

      if (response && response.success) {
        return response.data
      }

      throw new Error(response?.message || 'Upload failed')
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
    })
    formData.append('folder', folder)

    try {
      // Use uploadFile method instead of post to handle FormData properly
      const response = await apiClient.uploadFile<ApiResponse>('/upload/images', formData, {
        showLoading: false,
        showSuccessToast: false,
        showErrorToast: false,
      })

      if (response && response.success) {
        return response.data
      }

      throw new Error(response?.message || 'Upload failed')
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
      const response = await apiClient.delete<ApiResponse>(`/upload/image?publicId=${publicId}`)

      if (!response?.success) {
        throw new Error(response?.message || 'Delete failed')
      }
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

