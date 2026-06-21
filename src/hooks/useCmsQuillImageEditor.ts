import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type Quill from 'quill'
import type ReactQuill from 'react-quill-new'
import UploadService from '../services/api/upload.service'
import {
  buildCmsQuillModules,
  type CmsQuillToolbarPreset,
} from '../lib/cmsQuillImage'
import { useToast } from '../components/ui/use-toast'

const CLOUDINARY_LIBRARY_LIMIT = 48

export function useCmsQuillImageEditor(params: {
  folder: string
  toolbarPreset: CmsQuillToolbarPreset
}) {
  const { folder, toolbarPreset } = params
  const { toast } = useToast()
  const quillRef = useRef<ReactQuill>(null)
  const pendingQuillRef = useRef<Quill | null>(null)
  const pendingIndexRef = useRef(0)

  const [uploading, setUploading] = useState(false)
  const [altDialogOpen, setAltDialogOpen] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)
  const [altDraft, setAltDraft] = useState('')

  const [cloudinaryOpen, setCloudinaryOpen] = useState(false)
  const [cloudinaryLoading, setCloudinaryLoading] = useState(false)
  const [cloudinaryError, setCloudinaryError] = useState<string | null>(null)
  const [cloudinaryImages, setCloudinaryImages] = useState<Array<{ url: string; publicId: string }>>([])

  const openAltForImage = useCallback((url: string, insertIndex: number, quill: Quill) => {
    pendingQuillRef.current = quill
    pendingIndexRef.current = insertIndex
    setPendingImageUrl(url)
    setAltDraft('')
    setAltDialogOpen(true)
  }, [])

  const quillModules = useMemo(
    () =>
      buildCmsQuillModules(
        folder,
        {
          onUploadStart: () => setUploading(true),
          onUploadError: (message) => {
            setUploading(false)
            toast({ title: 'Image upload failed', description: message, variant: 'destructive' })
          },
          onImageReadyForAlt: (url, insertIndex, quill) => {
            setUploading(false)
            openAltForImage(url, insertIndex, quill)
          },
          onOpenCloudinaryLibrary: (insertIndex, quill) => {
            pendingQuillRef.current = quill
            pendingIndexRef.current = insertIndex
            setCloudinaryOpen(true)
          },
        },
        toolbarPreset,
      ),
    [folder, openAltForImage, toast, toolbarPreset],
  )

  const confirmAlt = useCallback(() => {
    const url = pendingImageUrl
    const alt = altDraft.trim()
    const editor = pendingQuillRef.current
    if (!url || !editor) {
      setAltDialogOpen(false)
      return
    }
    if (!alt) {
      toast({
        title: 'Alt text required',
        description: 'Describe the image for screen readers and Google Image SEO.',
        variant: 'destructive',
      })
      return
    }
    const idx = pendingIndexRef.current
    editor.insertEmbed(idx, 'image', url, 'user')
    editor.formatText(idx, 1, { alt }, 'user')
    editor.setSelection(idx + 1, 0)
    setAltDialogOpen(false)
    setPendingImageUrl(null)
    setAltDraft('')
    toast({ title: 'Image inserted', description: 'Alt text saved with this image.' })
  }, [altDraft, pendingImageUrl, toast])

  const cancelAlt = useCallback(() => {
    setAltDialogOpen(false)
    setPendingImageUrl(null)
    setAltDraft('')
  }, [])

  useEffect(() => {
    if (!cloudinaryOpen) return
    setCloudinaryLoading(true)
    setCloudinaryError(null)
    void UploadService.listImages(folder, CLOUDINARY_LIBRARY_LIMIT)
      .then((rows) => setCloudinaryImages(rows.map((r) => ({ url: r.url, publicId: r.publicId ?? r.url }))))
      .catch((e: unknown) =>
        setCloudinaryError(e instanceof Error ? e.message : 'Could not load Cloudinary library'),
      )
      .finally(() => setCloudinaryLoading(false))
  }, [cloudinaryOpen, folder])

  const pickFromLibrary = useCallback(
    (url: string) => {
      setCloudinaryOpen(false)
      const quill = pendingQuillRef.current
      if (!quill) return
      openAltForImage(url, pendingIndexRef.current, quill)
    },
    [openAltForImage],
  )

  return {
    quillRef,
    quillModules,
    uploading,
    altDialogOpen,
    pendingImageUrl,
    altDraft,
    setAltDraft,
    confirmAlt,
    cancelAlt,
    cloudinaryOpen,
    setCloudinaryOpen,
    cloudinaryLoading,
    cloudinaryError,
    cloudinaryImages,
    pickFromLibrary,
    folder,
  }
}
