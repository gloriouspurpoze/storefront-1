import React from 'react'
import { RichTextField } from '../forms/RichTextField'

const COMPACT_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
  clipboard: { matchVisual: false },
} as const

const COMPACT_FORMATS = ['bold', 'italic', 'underline', 'list', 'bullet', 'link'] as const

export interface SeoCompactRichTextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  helperText?: string
  height?: number
  showCharCount?: boolean
}

/** Lightweight Quill for speakable blocks (quick answer, takeaway bullets). */
export function SeoCompactRichTextField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  helperText,
  height = 140,
  showCharCount,
}: SeoCompactRichTextFieldProps) {
  return (
    <RichTextField
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      helperText={helperText}
      height={height}
      modules={COMPACT_MODULES}
      formats={[...COMPACT_FORMATS]}
      showCharCount={showCharCount}
    />
  )
}
