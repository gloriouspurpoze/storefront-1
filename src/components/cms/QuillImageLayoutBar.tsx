import React from 'react'
import type Quill from 'quill'
import { Button } from '../ui/button'
import {
  applyCmsImageLayoutAtIndex,
  getSelectedImageIndex,
  readCmsImageLayoutAtIndex,
  type CmsImageLayout,
} from '../../lib/quillCmsImage'
import { CmsQuillImageLayoutFields, layoutOptionsFromFields } from './CmsQuillImageLayoutFields'

type Props = {
  quill: Quill | null
  disabled?: boolean
  /** Bump when Quill selection changes so the bar re-reads the active image. */
  selectionTick?: number
  onApplied?: () => void
}

/** Inline bar — click an image in the editor, then adjust layout / size. */
export function QuillImageLayoutBar({ quill, disabled, selectionTick = 0, onApplied }: Props) {
  const index = quill ? getSelectedImageIndex(quill) : null
  const [layout, setLayout] = React.useState<CmsImageLayout>('block')
  const [widthPx, setWidthPx] = React.useState<number | 'full' | ''>('')
  const [heightPx, setHeightPx] = React.useState<number | 'auto' | ''>('auto')

  React.useEffect(() => {
    if (!quill || index == null) return
    const current = readCmsImageLayoutAtIndex(quill, index)
    setLayout(current.layout ?? 'block')
    setWidthPx(current.widthPx ?? '')
    setHeightPx(current.heightPx ?? 'auto')
  }, [quill, index, selectionTick])

  if (!quill || index == null || disabled) return null

  const apply = () => {
    applyCmsImageLayoutAtIndex(quill, index, layoutOptionsFromFields(layout, widthPx, heightPx))
    onApplied?.()
  }

  return (
    <div className="mb-2 rounded-md border border-primary/25 bg-primary/5 px-3 py-2">
      <p className="mb-2 text-xs font-medium text-foreground">Image layout — click Apply after changes</p>
      <CmsQuillImageLayoutFields
        compact
        layout={layout}
        widthPx={widthPx}
        heightPx={heightPx}
        onLayoutChange={setLayout}
        onWidthChange={setWidthPx}
        onHeightChange={setHeightPx}
      />
      <div className="mt-2 flex justify-end">
        <Button type="button" size="sm" onClick={apply}>
          Apply to image
        </Button>
      </div>
    </div>
  )
}

export default QuillImageLayoutBar
