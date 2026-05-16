import React, { useCallback, useRef, useState } from 'react'
import {
  CloudUpload,
  Film,
  Image as ImageIcon,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { ImageUploadField, type ImageFile } from '../forms'
import { FormField } from '../forms'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/separator'
import { cn } from '../../lib/utils'
import type { SliderMediaType, SliderPlaybackSettings } from '../../types'
import {
  DEFAULT_SLIDER_PLAYBACK,
  SLIDER_MEDIA_SPECS,
  buildSliderPreviewSources,
} from '../../lib/sliderMedia'
import { SliderResponsivePreview } from './SliderResponsivePreview'
import UploadService from '../../services/api/upload.service'
import { appToast } from '../../lib/appToast'

export interface SliderMediaFormValues {
  media_type: SliderMediaType
  image_url: string
  video_url: string
  poster_url: string
  lottie_url: string
  playback: SliderPlaybackSettings
}

interface SliderMediaFormSectionProps {
  values: SliderMediaFormValues
  onChange: (patch: Partial<SliderMediaFormValues>) => void
  uploadedImages: ImageFile[]
  onUploadedImagesChange: (images: ImageFile[]) => void
  uploadedPoster: ImageFile[]
  onUploadedPosterChange: (images: ImageFile[]) => void
  imageAlt?: string
  onImageAltChange?: (value: string) => void
  errors: Record<string, string>
  onClearError: (key: string) => void
  previewTitle?: string
  previewSubtitle?: string
  previewButton?: string
}

const MEDIA_TYPES: SliderMediaType[] = ['image', 'gif', 'video', 'lottie']

export function SliderMediaFormSection({
  values,
  onChange,
  uploadedImages,
  onUploadedImagesChange,
  uploadedPoster,
  onUploadedPosterChange,
  imageAlt,
  onImageAltChange,
  errors,
  onClearError,
  previewTitle,
  previewSubtitle,
  previewButton,
}: SliderMediaFormSectionProps) {
  const videoInputRef = useRef<HTMLInputElement>(null)
  const lottieInputRef = useRef<HTMLInputElement>(null)
  const [videoUploading, setVideoUploading] = useState(false)
  const [lottieUploading, setLottieUploading] = useState(false)

  const mediaType = values.media_type
  const spec = SLIDER_MEDIA_SPECS[mediaType]

  const uploadVideoFile = useCallback(
    async (file: File) => {
      setVideoUploading(true)
      try {
        const res = await UploadService.uploadVideo(file, 'homeservice/sliders/video')
        onChange({ video_url: res.url })
        onClearError('video_url')
        appToast('Video uploaded', 'success')
      } catch (e) {
        appToast(e instanceof Error ? e.message : 'Video upload failed', 'error')
      } finally {
        setVideoUploading(false)
      }
    },
    [onChange, onClearError],
  )

  const uploadLottieFile = useCallback(
    async (file: File) => {
      setLottieUploading(true)
      try {
        const res = await UploadService.uploadLottie(file, 'homeservice/sliders/lottie')
        onChange({ lottie_url: res.url })
        onClearError('lottie_url')
        appToast('Lottie file uploaded', 'success')
      } catch (e) {
        appToast(e instanceof Error ? e.message : 'Lottie upload failed', 'error')
      } finally {
        setLottieUploading(false)
      }
    },
    [onChange, onClearError],
  )

  const previewSources = buildSliderPreviewSources({
    media_type: values.media_type,
    image_url: uploadedImages[0]?.url || values.image_url,
    video_url: values.video_url,
    poster_url: uploadedPoster[0]?.url || values.poster_url,
    lottie_url: values.lottie_url,
    playback: values.playback,
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)] lg:items-start xl:gap-8">
      {/* ——— Asset configuration ——— */}
      <div className="min-w-0 space-y-6">
        <div>
          <Label className="text-sm font-semibold">Media type</Label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MEDIA_TYPES.map((type) => (
              <MediaTypeCard
                key={type}
                type={type}
                active={mediaType === type}
                onSelect={() => onChange({ media_type: type })}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{spec.hint}</p>
          <p className="text-xs text-muted-foreground">
            Max {spec.maxMb} MB · {spec.formats}
          </p>
        </div>

        {(mediaType === 'image' || mediaType === 'gif') && (
          <AssetBlock title={mediaType === 'gif' ? 'Animated GIF' : 'Hero image'}>
            <ImageUploadField
              label="Upload"
              value={uploadedImages}
              onChange={(images) => {
                onUploadedImagesChange(images)
                if (images.length > 0) {
                  onChange({ image_url: images[0].url })
                  onClearError('image_url')
                } else {
                  onChange({ image_url: '' })
                }
              }}
              required
              maxFiles={1}
              maxSize={mediaType === 'gif' ? 8 : 5}
              folder="sliders"
              acceptedTypes={
                mediaType === 'gif'
                  ? ['image/gif']
                  : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
              }
            />
            {errors.image_url ? (
              <p className="text-xs text-destructive">{errors.image_url}</p>
            ) : null}
            <UrlField
              label="Or paste URL"
              value={values.image_url}
              onChange={(v) => {
                onChange({ image_url: v })
                onClearError('image_url')
              }}
              error={errors.image_url}
            />
          </AssetBlock>
        )}

        {mediaType === 'video' && (
          <AssetBlock title="Video">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void uploadVideoFile(f)
                e.target.value = ''
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={videoUploading}
              onClick={() => videoInputRef.current?.click()}
            >
              {videoUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CloudUpload className="mr-2 h-4 w-4" />
              )}
              Upload MP4 / WebM
            </Button>
            <UrlField
              label="Video URL"
              value={values.video_url}
              onChange={(v) => {
                onChange({ video_url: v })
                onClearError('video_url')
              }}
              error={errors.video_url}
              placeholder="https://…/hero.mp4"
            />
            <Separator />
            <p className="text-xs font-medium text-muted-foreground">Poster (loads before play)</p>
            <ImageUploadField
              label="Upload poster"
              value={uploadedPoster}
              onChange={(images) => {
                onUploadedPosterChange(images)
                onChange({ poster_url: images[0]?.url || '' })
              }}
              maxFiles={1}
              maxSize={5}
              folder="sliders"
            />
            <UrlField
              label="Poster URL"
              value={values.poster_url}
              onChange={(v) => onChange({ poster_url: v })}
            />
          </AssetBlock>
        )}

        {mediaType === 'lottie' && (
          <AssetBlock title="Lottie animation">
            <input
              ref={lottieInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void uploadLottieFile(f)
                e.target.value = ''
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={lottieUploading}
              onClick={() => lottieInputRef.current?.click()}
            >
              {lottieUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CloudUpload className="mr-2 h-4 w-4" />
              )}
              Upload JSON
            </Button>
            <UrlField
              label="Lottie JSON URL"
              value={values.lottie_url}
              onChange={(v) => {
                onChange({ lottie_url: v })
                onClearError('lottie_url')
              }}
              error={errors.lottie_url}
            />
            <Separator />
            <p className="text-xs font-medium text-muted-foreground">Fallback poster</p>
            <ImageUploadField
              label="Upload poster"
              value={uploadedPoster}
              onChange={(images) => {
                onUploadedPosterChange(images)
                const url = images[0]?.url || ''
                onChange({ poster_url: url, image_url: url || values.image_url })
              }}
              maxFiles={1}
              maxSize={5}
              folder="sliders"
            />
          </AssetBlock>
        )}

        {(mediaType === 'video' || mediaType === 'lottie') && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Playback</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['autoplay', 'Autoplay'],
                  ['loop', 'Loop'],
                  ['muted', 'Muted'],
                  ['playsInline', 'Plays inline'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5">
                  <Switch
                    id={`pb-${key}`}
                    checked={values.playback[key]}
                    onCheckedChange={(c) =>
                      onChange({
                        playback: { ...values.playback, [key]: c === true },
                      })
                    }
                  />
                  <Label htmlFor={`pb-${key}`} className="text-sm font-normal">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onChange({ playback: { ...DEFAULT_SLIDER_PLAYBACK } })}
            >
              Reset playback defaults
            </Button>
          </div>
        )}

        {onImageAltChange ? (
          <FormField
            label="Alt text (accessibility)"
            value={imageAlt ?? ''}
            onChange={onImageAltChange}
            placeholder="Describe the slide"
            helperText="Screen readers and SEO"
          />
        ) : null}
      </div>

      {/* ——— Sticky responsive preview ——— */}
      <div className="lg:sticky lg:top-4">
        <SliderResponsivePreview
          sources={previewSources}
          title={previewTitle}
          subtitle={previewSubtitle}
          buttonText={previewButton}
        />
      </div>
    </div>
  )
}

function MediaTypeCard({
  type,
  active,
  onSelect,
}: {
  type: SliderMediaType
  active: boolean
  onSelect: () => void
}) {
  const Icon = type === 'video' ? Film : type === 'lottie' ? Sparkles : ImageIcon
  const shortLabel =
    type === 'image' ? 'Image' : type === 'gif' ? 'GIF' : type === 'video' ? 'Video' : 'Lottie'
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-xs font-medium leading-tight">{shortLabel}</span>
    </button>
  )
}

function AssetBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </div>
  )
}

function UrlField({
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
}) {
  return (
    <FormField
      label={label}
      value={value}
      onChange={onChange}
      type="url"
      error={error}
      placeholder={placeholder}
    />
  )
}
