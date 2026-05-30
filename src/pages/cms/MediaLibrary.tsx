import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FolderOpen,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Link2,
  LayoutGrid,
  List,
  Search,
  Plus,
  ExternalLink,
  Copy,
  Trash2,
  Eye,
  Loader2,
  HardDrive,
  Sparkles,
  Upload,
} from 'lucide-react'
import { CMSService } from '../../services/api'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { appToast } from '../../lib/appToast'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Textarea } from '../../components/ui/textarea'
const FOLDER_PRESETS = [
  'brand',
  'marketing',
  'reports',
  'finance',
  'hr-legal',
  'product',
  'google-workspace',
  'uploads',
] as const

type MediaType = 'image' | 'video' | 'document' | 'audio' | 'other'

interface MediaFile {
  _id: string
  filename: string
  originalName: string
  url: string
  thumbnailUrl?: string
  mimeType?: string
  type: MediaType
  size: number
  folder: string
  metadata: {
    alt?: string
    caption?: string
    description?: string
  }
  tags: string[]
  usageCount: number
  uploadedBy?: { name?: string }
  createdAt: string
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function guessMimeFromUrl(url: string): string {
  const path = url.split('?')[0].toLowerCase()
  if (/\.(jpe?g)$/i.test(path)) return 'image/jpeg'
  if (/\.png$/i.test(path)) return 'image/png'
  if (/\.gif$/i.test(path)) return 'image/gif'
  if (/\.webp$/i.test(path)) return 'image/webp'
  if (/\.svg$/i.test(path)) return 'image/svg+xml'
  if (/\.mp4$/i.test(path)) return 'video/mp4'
  if (/\.webm$/i.test(path)) return 'video/webm'
  if (/\.mov$/i.test(path)) return 'video/quicktime'
  if (/\.pdf$/i.test(path)) return 'application/pdf'
  if (/\.docx$/i.test(path)) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (/\.doc$/i.test(path)) return 'application/msword'
  if (/\.xlsx$/i.test(path)) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  if (/\.xls$/i.test(path)) return 'application/vnd.ms-excel'
  if (/\.pptx$/i.test(path)) {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }
  if (/\.ppt$/i.test(path)) return 'application/vnd.ms-powerpoint'
  if (/\.csv$/i.test(path)) return 'text/csv'
  if (/\.zip$/i.test(path)) return 'application/zip'
  if (/docs\.google\.com\/document/i.test(url)) return 'application/vnd.google-apps.document'
  if (/sheets\.google\.com|docs\.google\.com\/spreadsheets/i.test(url)) {
    return 'application/vnd.google-apps.spreadsheet'
  }
  if (/docs\.google\.com\/presentation|slides\.google\.com/i.test(url)) {
    return 'application/vnd.google-apps.presentation'
  }
  if (/drive\.google\.com/i.test(url)) return 'application/vnd.google-apps.shortcut'
  return 'application/octet-stream'
}

function fileNameFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const last = u.pathname.split('/').filter(Boolean).pop()
    return last || 'asset'
  } catch {
    return 'asset'
  }
}

function isGoogleWorkspaceUrl(url: string): boolean {
  return /docs\.google\.com|drive\.google\.com|sheets\.google\.com|slides\.google\.com/i.test(url)
}

function typeIcon(t: MediaType) {
  switch (t) {
    case 'image':
      return ImageIcon
    case 'video':
      return Video
    case 'audio':
      return Music
    case 'document':
      return FileText
    default:
      return Link2
  }
}

const MIME_OPTIONS: { value: string; label: string }[] = [
  { value: 'image/jpeg', label: 'Image — JPEG' },
  { value: 'image/png', label: 'Image — PNG' },
  { value: 'image/gif', label: 'Image — GIF' },
  { value: 'image/webp', label: 'Image — WebP' },
  { value: 'image/svg+xml', label: 'Image — SVG' },
  { value: 'video/mp4', label: 'Video — MP4' },
  { value: 'video/webm', label: 'Video — WebM' },
  { value: 'video/quicktime', label: 'Video — MOV' },
  { value: 'application/pdf', label: 'Document — PDF' },
  {
    value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    label: 'Document — Word (.docx)',
  },
  {
    value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    label: 'Spreadsheet — Excel (.xlsx)',
  },
  {
    value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    label: 'Presentation — PowerPoint (.pptx)',
  },
  { value: 'text/csv', label: 'Data — CSV' },
  { value: 'application/vnd.google-apps.document', label: 'Link — Google Doc' },
  { value: 'application/vnd.google-apps.spreadsheet', label: 'Link — Google Sheet' },
  { value: 'application/vnd.google-apps.presentation', label: 'Link — Google Slides' },
  { value: 'application/vnd.google-apps.shortcut', label: 'Link — Google Drive' },
  { value: 'application/octet-stream', label: 'Other / unknown' },
]

const CMS_UPLOAD_MAX_BYTES = 15 * 1024 * 1024
const CMS_UPLOAD_ACCEPT_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
])

function validateCmsUpload(file: File): string | null {
  if (!file.size || file.size > CMS_UPLOAD_MAX_BYTES) {
    return `Choose a file under ${formatBytes(CMS_UPLOAD_MAX_BYTES)} (photos, PDFs, Office docs, short video).`
  }
  if (file.type && !CMS_UPLOAD_ACCEPT_MIME.has(file.type)) {
    return 'This file type is not allowed. Use images, PDF, Office documents, CSV, or MP4/WebM/MOV.'
  }
  return null
}

export default function MediaLibrary() {
  const confirm = useAppConfirm()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 24, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [folderFilter, setFolderFilter] = useState<string>('all')
  const [folders, setFolders] = useState<string[]>([])
  const [typeStats, setTypeStats] = useState<Array<{ _id: string; count: number; totalSize: number }>>([])
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addTab, setAddTab] = useState<'link' | 'upload' | 'guide'>('link')
  const [uploadSaving, setUploadSaving] = useState(false)

  const [form, setForm] = useState({
    url: '',
    filename: '',
    mimeType: 'application/pdf',
    size: 0,
    folder: 'marketing',
    description: '',
    tags: '',
  })

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }))
  }, [debouncedSearch, typeFilter, folderFilter])

  const loadFoldersAndStats = useCallback(async () => {
    try {
      const [folderList, stats] = await Promise.all([
        CMSService.getMediaFolders(),
        CMSService.getMediaStats(),
      ])
      setFolders(
        Array.from(new Set([...(folderList || []), ...FOLDER_PRESETS]))
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b)),
      )
      setTypeStats(Array.isArray(stats) ? stats : [])
    } catch {
      setFolders([...FOLDER_PRESETS])
    }
  }, [])

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await CMSService.getMedia({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        folder: folderFilter === 'all' ? undefined : folderFilter,
      })
      const raw = (data?.files || []) as MediaFile[]
      setFiles(raw)
      if (data?.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          pages: Math.max(1, data.pagination.pages || 1),
        }))
      }
    } catch (e) {
      console.error(e)
      appToast('Could not load media library', 'error')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, debouncedSearch, typeFilter, folderFilter])

  useEffect(() => {
    void loadFoldersAndStats()
  }, [loadFoldersAndStats])

  useEffect(() => {
    void fetchFiles()
  }, [fetchFiles])

  const totalAssets = useMemo(
    () => typeStats.reduce((acc, s) => acc + (s.count || 0), 0),
    [typeStats],
  )

  const handleUrlBlur = () => {
    if (!form.url.trim()) return
    const mime = guessMimeFromUrl(form.url.trim())
    const name = form.filename.trim() || fileNameFromUrl(form.url.trim())
    setForm((f) => ({
      ...f,
      mimeType: mime,
      filename: name,
      size: f.size || 0,
    }))
  }

  const handleUploadAsset = async (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file) {
      appToast('Choose a file from your device', 'error')
      return
    }
    const v = validateCmsUpload(file)
    if (v) {
      appToast(v, 'error')
      return
    }
    setUploadSaving(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', form.folder.trim() || 'uploads')
      if (form.description.trim()) fd.append('description', form.description.trim())
      if (form.tags.trim()) fd.append('tags', form.tags.trim())
      const raw = await CMSService.uploadMedia(fd)
      const envelope = raw as { file?: MediaFile } & MediaFile
      const created = envelope.file ?? (envelope._id ? envelope : null)
      if (!created?._id) {
        appToast('Upload succeeded but library response was unexpected', 'error')
        return
      }
      appToast('File uploaded to library', 'success')
      setAddOpen(false)
      setForm({
        url: '',
        filename: '',
        mimeType: 'application/pdf',
        size: 0,
        folder: 'marketing',
        description: '',
        tags: '',
      })
      void loadFoldersAndStats()
      void fetchFiles()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null
      appToast(typeof msg === 'string' ? msg : 'Upload failed', 'error')
    } finally {
      setUploadSaving(false)
    }
  }

  const handleRegisterAsset = async () => {
    if (!form.url.trim()) {
      appToast('Paste a URL to the file or Google Doc/Sheet/Drive link', 'error')
      return
    }
    const url = form.url.trim()
    const originalName = form.filename.trim() || fileNameFromUrl(url)
    const mime = form.mimeType || guessMimeFromUrl(url)
    const payload = {
      filename: originalName.replace(/\s+/g, '-').toLowerCase(),
      originalName,
      url,
      mimeType: mime,
      size: Number(form.size) || 0,
      folder: form.folder.trim() || 'uploads',
      metadata: {
        description: form.description.trim() || undefined,
      },
      tags: form.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    }
    try {
      await CMSService.createMediaRecord(payload)
      appToast('Asset added to library', 'success')
      setAddOpen(false)
      setForm({
        url: '',
        filename: '',
        mimeType: 'application/pdf',
        size: 0,
        folder: 'marketing',
        description: '',
        tags: '',
      })
      void loadFoldersAndStats()
      void fetchFiles()
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e ? (e as any).response?.data?.error : null
      appToast(typeof msg === 'string' ? msg : 'Failed to register asset', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Remove asset?',
      message: 'It will be hidden from the library (soft delete).',
      danger: true,
      confirmLabel: 'Remove',
    })
    if (!ok) return
    try {
      await CMSService.deleteMedia(id)
      appToast('Removed from library', 'success')
      setSelectedFile(null)
      void loadFoldersAndStats()
      void fetchFiles()
    } catch {
      appToast('Delete failed', 'error')
    }
  }

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      appToast('Link copied', 'success')
    } catch {
      appToast('Could not copy', 'error')
    }
  }

  const typeChips: { id: string; label: string }[] = [
    { id: '', label: 'All' },
    { id: 'image', label: 'Images' },
    { id: 'video', label: 'Video' },
    { id: 'document', label: 'Docs & sheets' },
    { id: 'audio', label: 'Audio' },
    { id: 'other', label: 'Other links' },
  ]

  return (
    <div className="min-h-0 flex-1 p-4 md:p-6">
      <PageHeader
        title="Content hub"
        subtitle="One place for images, videos, PDFs, Office files, and Google Docs/Sheets/Drive links. Register a stable URL, add folders and tags, then search and reuse across CMS and teams."
        icon={<FolderOpen className="h-7 w-7 md:h-8 md:w-8" aria-hidden />}
        action={
          <Button type="button" onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Register asset
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80">
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{totalAssets}</p>
              <p className="text-xs text-muted-foreground">Total registered assets</p>
            </div>
          </CardContent>
        </Card>
        {(['image', 'video', 'document', 'audio', 'other'] as const).map((key) => {
          const row = typeStats.find((s) => s._id === key)
          const Icon = typeIcon(key)
          return (
            <Card key={key} className="border-border/80">
              <CardContent className="flex items-center gap-3 pt-4">
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{row?.count ?? 0}</p>
                  <p className="text-xs capitalize text-muted-foreground">{key}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mb-4 border-border/80">
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="media-search" className="text-xs text-muted-foreground">
                Search name, tags, description, or URL
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="media-search"
                  className="pl-9"
                  placeholder="e.g. Q4 report, hero banner, drive.google.com…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[320px]">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Folder</Label>
                <Select value={folderFilter} onValueChange={setFolderFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All folders</SelectItem>
                    {folders.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end justify-end gap-1 sm:col-span-2 lg:col-span-1">
                <Button
                  type="button"
                  variant={viewMode === 'grid' ? 'secondary' : 'outline'}
                  size="icon"
                  className="shrink-0"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'list' ? 'secondary' : 'outline'}
                  size="icon"
                  className="shrink-0"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {typeChips.map((c) => (
              <Button
                key={c.id || 'all'}
                type="button"
                size="sm"
                variant={typeFilter === c.id ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setTypeFilter(c.id)}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading library…
        </div>
      ) : files.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-medium">No assets match your filters</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Register links to S3, Cloudinary, Google Drive, or any HTTPS URL. Use folders like{' '}
              <span className="font-mono text-xs">reports</span> or{' '}
              <span className="font-mono text-xs">google-workspace</span> so the team can browse consistently.
            </p>
            <Button type="button" onClick={() => setAddOpen(true)}>
              Register your first asset
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => {
            const Icon = typeIcon(file.type)
            const google = isGoogleWorkspaceUrl(file.url)
            return (
              <Card
                key={file._id}
                className="cursor-pointer overflow-hidden border-border/80 transition-shadow hover:shadow-md"
                onClick={() => setSelectedFile(file)}
              >
                <div className="relative flex h-40 items-center justify-center bg-muted/50">
                  {file.type === 'image' && file.url ? (
                    <img
                      src={file.thumbnailUrl || file.url}
                      alt={file.metadata?.alt || file.originalName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : file.type === 'video' && file.url ? (
                    <video
                      src={file.url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <Icon className="h-14 w-14 text-muted-foreground" />
                  )}
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {file.type}
                    </Badge>
                    {google && (
                      <Badge variant="outline" className="border-primary/40 text-[10px] text-primary dark:text-primary">
                        Google
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="space-y-1 p-3">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.folder} · {formatBytes(file.size)}
                  </p>
                  {file.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {file.tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px] font-normal">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="overflow-hidden border-border/80 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => {
                const Icon = typeIcon(file.type)
                return (
                  <TableRow key={file._id} className="cursor-pointer" onClick={() => setSelectedFile(file)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                          {file.type === 'image' && file.thumbnailUrl ? (
                            <img src={file.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{file.originalName}</p>
                          <p className="truncate text-xs text-muted-foreground">{file.url}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{file.folder}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {file.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatBytes(file.size)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedFile(file)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => void copyUrl(file.url)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {!loading && files.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
            onItemsPerPageChange={(n) => setPagination((prev) => ({ ...prev, limit: n, page: 1 }))}
            itemsPerPageOptions={[12, 24, 48, 96]}
          />
        </div>
      )}

      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o)
          if (o) setAddTab('link')
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Register asset</DialogTitle>
          </DialogHeader>
          <Tabs value={addTab} onValueChange={(v) => setAddTab(v as 'link' | 'upload' | 'guide')} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="link">Link URL</TabsTrigger>
              <TabsTrigger value="upload">Upload file</TabsTrigger>
              <TabsTrigger value="guide">Guide</TabsTrigger>
            </TabsList>
            <TabsContent value="link" className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="asset-url">HTTPS URL *</Label>
                <Input
                  id="asset-url"
                  placeholder="https://cdn…/report.pdf or Google Docs/Sheets share link"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  onBlur={handleUrlBlur}
                />
                <p className="text-xs text-muted-foreground">
                  Paste a direct file URL or a viewable Google Workspace link. MIME type is guessed from the path;
                  override below if needed.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="asset-name">Display name</Label>
                  <Input
                    id="asset-name"
                    placeholder="Q4-2025-summary.pdf"
                    value={form.filename}
                    onChange={(e) => setForm((f) => ({ ...f, filename: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="asset-folder">Folder</Label>
                  <Input
                    id="asset-folder"
                    placeholder="e.g. reports, marketing, brand"
                    value={form.folder}
                    onChange={(e) => setForm((f) => ({ ...f, folder: e.target.value }))}
                  />
                  <div className="flex flex-wrap gap-1">
                    {FOLDER_PRESETS.map((f) => (
                      <Button
                        key={f}
                        type="button"
                        variant={form.folder === f ? 'secondary' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setForm((prev) => ({ ...prev, folder: f }))}
                      >
                        {f}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>File type (MIME)</Label>
                  <Select value={form.mimeType} onValueChange={(v) => setForm((f) => ({ ...f, mimeType: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {MIME_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="asset-size">Size (bytes, optional)</Label>
                  <Input
                    id="asset-size"
                    type="number"
                    min={0}
                    value={form.size || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, size: e.target.value === '' ? 0 : Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="asset-desc">Internal description</Label>
                <Textarea
                  id="asset-desc"
                  placeholder="Where this is used, owner, expiry, or compliance notes…"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="asset-tags">Tags</Label>
                <Input
                  id="asset-tags"
                  placeholder="invoice, 2025, homepage-hero"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Comma-separated; stored lowercase.</p>
              </div>
            </TabsContent>
            <TabsContent value="upload" className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">
                Images, PDF, Word/Excel/PowerPoint, CSV, and short video — max {formatBytes(CMS_UPLOAD_MAX_BYTES)} per
                file. Heavier assets should use a URL instead.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="upload-folder">Folder</Label>
                <Input
                  id="upload-folder"
                  placeholder="e.g. uploads, marketing"
                  value={form.folder}
                  onChange={(e) => setForm((f) => ({ ...f, folder: e.target.value }))}
                />
                <div className="flex flex-wrap gap-1">
                  {FOLDER_PRESETS.map((f) => (
                    <Button
                      key={f}
                      type="button"
                      variant={form.folder === f ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setForm((prev) => ({ ...prev, folder: f }))}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="upload-desc">Description (optional)</Label>
                <Textarea
                  id="upload-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="upload-tags">Tags (optional)</Label>
                <Input
                  id="upload-tags"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cms-file-input">File</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id="cms-file-input"
                    type="file"
                    accept={Array.from(CMS_UPLOAD_ACCEPT_MIME).join(',')}
                    disabled={uploadSaving}
                    className="max-w-full sm:max-w-md"
                    onChange={(e) => void handleUploadAsset(e.target.files)}
                  />
                  {uploadSaving ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden /> : null}
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Choosing a file uploads it immediately after validation.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="guide" className="space-y-3 pt-2 text-sm text-muted-foreground">
              <ul className="list-inside list-disc space-y-2">
                <li>
                  <strong className="text-foreground">Google Docs/Sheets</strong>: use the normal browser URL (view
                  or edit). Anyone consuming the CMS should have access consistent with that link&apos;s sharing
                  settings.
                </li>
                <li>
                  <strong className="text-foreground">PDFs &amp; Office</strong>: host on HTTPS (S3, Drive, SharePoint,
                  etc.) and paste the stable URL here.
                </li>
                <li>
                  <strong className="text-foreground">Images &amp; video</strong>: CDN or storage URLs work well; add{' '}
                  <span className="font-mono text-xs">alt</span> later from edit flows where needed.
                </li>
                <li>
                  <strong className="text-foreground">Folders &amp; tags</strong>: align with finance, marketing, or
                  product so search stays predictable as the library grows.
                </li>
              </ul>
            </TabsContent>
          </Tabs>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            {addTab === 'link' ? (
              <Button type="button" onClick={() => void handleRegisterAsset()}>
                Save to library
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedFile} onOpenChange={(o) => !o && setSelectedFile(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
          {selectedFile && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8 leading-snug">{selectedFile.originalName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedFile.type === 'image' && (
                  <div className="overflow-hidden rounded-lg border bg-muted/30">
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.metadata?.alt || ''}
                      className="max-h-64 w-full object-contain"
                    />
                  </div>
                )}
                {selectedFile.type === 'video' && (
                  <video src={selectedFile.url} controls className="max-h-64 w-full rounded-lg border bg-black" />
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {selectedFile.type}
                  </Badge>
                  {isGoogleWorkspaceUrl(selectedFile.url) && (
                    <Badge variant="outline" className="border-primary/40 text-primary dark:text-primary">
                      Google Workspace
                    </Badge>
                  )}
                  {selectedFile.mimeType && (
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {selectedFile.mimeType}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">URL</p>
                  <p className="break-all rounded-md bg-muted/50 p-2 font-mono text-xs">{selectedFile.url}</p>
                </div>
                {selectedFile.metadata?.description && (
                  <div className="space-y-1 text-sm">
                    <p className="text-xs font-medium text-muted-foreground">Description</p>
                    <p>{selectedFile.metadata.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Folder</p>
                    <p className="font-medium">{selectedFile.folder}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="font-medium">{formatBytes(selectedFile.size)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Usage (refs)</p>
                    <p className="font-medium">{selectedFile.usageCount ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Uploaded</p>
                    <p className="font-medium">{new Date(selectedFile.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {selectedFile.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedFile.tags.map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void copyUrl(selectedFile.url)}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy URL
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={selectedFile.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Open
                    </a>
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleDelete(selectedFile._id)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Remove
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
