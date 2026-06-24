/**
 * CMS rich-text images — width, height, alt, and float layout (left / right / block).
 */
import Quill from 'quill'
import Image from 'quill/formats/image.js'

export type CmsImageLayout = 'block' | 'float-left' | 'float-right' | 'center'

export type CmsImageLayoutOptions = {
  layout?: CmsImageLayout
  widthPx?: number | 'full'
  heightPx?: number | 'auto'
}

const IMAGE_ATTRS = ['alt', 'height', 'width', 'data-layout'] as const

class CmsRichImage extends Image {
  static formats(domNode: HTMLElement) {
    const formats = super.formats(domNode) as Record<string, string>
    for (const attr of IMAGE_ATTRS) {
      if (domNode.hasAttribute(attr)) {
        formats[attr] = domNode.getAttribute(attr) ?? ''
      }
    }
    return formats
  }

  format(name: string, value: unknown) {
    if (IMAGE_ATTRS.includes(name as (typeof IMAGE_ATTRS)[number])) {
      if (value) {
        this.domNode.setAttribute(name, String(value))
      } else {
        this.domNode.removeAttribute(name)
      }
      if (name === 'data-layout') {
        applyLayoutClass(this.domNode as HTMLImageElement, (value as CmsImageLayout) || 'block')
      }
      return
    }
    super.format(name, value)
  }
}

let registered = false

export function registerCmsRichImageFormat(): void {
  if (registered) return
  Quill.register(CmsRichImage, true)
  registered = true
}

registerCmsRichImageFormat()

function applyLayoutClass(img: HTMLImageElement, layout: CmsImageLayout) {
  img.classList.remove('cms-img-block', 'cms-img-float-left', 'cms-img-float-right', 'cms-img-center')
  switch (layout) {
    case 'float-left':
      img.classList.add('cms-img-float-left')
      break
    case 'float-right':
      img.classList.add('cms-img-float-right')
      break
    case 'center':
      img.classList.add('cms-img-center')
      break
    default:
      img.classList.add('cms-img-block')
      break
  }
}

export function applyCmsImageLayoutAtIndex(
  quill: Quill,
  index: number,
  options: CmsImageLayoutOptions & { alt?: string },
): void {
  const formats: Record<string, string> = {}
  if (options.alt != null) formats.alt = options.alt

  const layout = options.layout ?? 'block'
  formats['data-layout'] = layout

  if (options.widthPx === 'full') {
    formats.width = ''
  } else if (options.widthPx != null && options.widthPx > 0) {
    formats.width = String(Math.round(options.widthPx))
  }

  if (options.heightPx != null && options.heightPx !== 'auto' && options.heightPx > 0) {
    formats.height = String(Math.round(options.heightPx))
  } else {
    formats.height = ''
  }

  quill.formatText(index, 1, formats, 'user')

  const [blot] = quill.getLeaf(index)
  const node = blot?.domNode
  if (node instanceof HTMLImageElement) {
    applyLayoutClass(node, layout)
    if (options.widthPx === 'full') {
      node.style.width = '100%'
      node.style.maxWidth = '100%'
      node.style.height = options.heightPx === 'auto' || !options.heightPx ? 'auto' : `${options.heightPx}px`
    } else if (options.widthPx) {
      node.style.width = `${options.widthPx}px`
      node.style.maxWidth = '100%'
      node.style.height = options.heightPx === 'auto' || !options.heightPx ? 'auto' : `${options.heightPx}px`
    } else {
      node.style.removeProperty('width')
      node.style.removeProperty('height')
    }
  }
}

/** Index of image embed under cursor, or null. */
export function getSelectedImageIndex(quill: Quill): number | null {
  const range = quill.getSelection()
  if (!range) return null

  const checkIndex = (idx: number) => {
    const [blot] = quill.getLeaf(idx)
    if (blot && (blot as { statics?: { blotName?: string } }).statics?.blotName === 'image') {
      return idx
    }
    return null
  }

  if (range.length > 0) {
    return checkIndex(range.index)
  }

  const atCursor = checkIndex(range.index)
  if (atCursor != null) return atCursor
  if (range.index > 0) return checkIndex(range.index - 1)
  return null
}

export function readCmsImageLayoutAtIndex(quill: Quill, index: number): CmsImageLayoutOptions & { alt: string } {
  const [blot] = quill.getLeaf(index)
  const node = blot?.domNode
  if (!(node instanceof HTMLImageElement)) {
    return { layout: 'block', widthPx: undefined, heightPx: 'auto', alt: '' }
  }
  const layout = (node.getAttribute('data-layout') as CmsImageLayout) || 'block'
  const w = node.getAttribute('width')
  const h = node.getAttribute('height')
  const widthPx =
    node.style.width === '100%' || w === '100%'
      ? 'full'
      : w
        ? Number.parseInt(w, 10)
        : node.style.width
          ? Number.parseInt(node.style.width, 10)
          : undefined
  const heightPx = h ? Number.parseInt(h, 10) : 'auto'
  return {
    layout,
    widthPx: Number.isFinite(widthPx as number) ? (widthPx as number) : widthPx === 'full' ? 'full' : undefined,
    heightPx: typeof heightPx === 'number' && Number.isFinite(heightPx) ? heightPx : 'auto',
    alt: node.getAttribute('alt') ?? '',
  }
}

export const CMS_IMAGE_WIDTH_PRESETS: { label: string; value: number | 'full' }[] = [
  { label: 'Small (160px)', value: 160 },
  { label: 'Medium (240px)', value: 240 },
  { label: 'Large (320px)', value: 320 },
  { label: 'Full width', value: 'full' },
]

export const CMS_IMAGE_LAYOUT_OPTIONS: { value: CmsImageLayout; label: string; hint: string }[] = [
  { value: 'float-left', label: 'Left', hint: 'Text wraps on the right' },
  { value: 'float-right', label: 'Right', hint: 'Text wraps on the left' },
  { value: 'block', label: 'Full row', hint: 'Image on its own line' },
  { value: 'center', label: 'Center', hint: 'Centered, own line' },
]

/** Editor + live-site CSS for floated CMS images. */
export function cmsRichImageLayoutCss(scopeClass: string): string {
  const s = scopeClass.startsWith('.') ? scopeClass : `.${scopeClass}`
  return `
    ${s} .ql-editor img,
    ${s} img.cms-img-block,
    ${s} img.cms-img-float-left,
    ${s} img.cms-img-float-right,
    ${s} img.cms-img-center {
      border-radius: 0.375rem;
      height: auto;
    }
    ${s} .ql-editor img[data-layout="float-left"],
    ${s} img.cms-img-float-left,
    ${s} img[data-layout="float-left"] {
      float: left !important;
      display: inline !important;
      margin: 0.25rem 1rem 0.75rem 0 !important;
      max-width: min(100%, 320px) !important;
      width: auto !important;
    }
    ${s} .ql-editor img[data-layout="float-right"],
    ${s} img.cms-img-float-right,
    ${s} img[data-layout="float-right"] {
      float: right !important;
      display: inline !important;
      margin: 0.25rem 0 0.75rem 1rem !important;
      max-width: min(100%, 320px) !important;
      width: auto !important;
    }
    ${s} .ql-editor img[data-layout="center"],
    ${s} img.cms-img-center,
    ${s} img[data-layout="center"] {
      display: block;
      margin: 0.75rem auto;
      max-width: 100%;
    }
    ${s} .ql-editor img[data-layout="block"],
    ${s} img.cms-img-block,
    ${s} img[data-layout="block"] {
      display: block;
      margin: 0.75rem 0;
      max-width: 100%;
    }
    ${s} .ql-editor::after {
      content: "";
      display: table;
      clear: both;
    }
  `
}
