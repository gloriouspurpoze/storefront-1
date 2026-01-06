import React, { useRef } from 'react'
import {
  Box,
  Typography,
  FormHelperText,
  Tooltip,
} from '@mui/material'
import {
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

export interface RichTextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  fullWidth?: boolean
  height?: number
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  modules?: any
  formats?: string[]
  showCharCount?: boolean
  maxLength?: number
}

export const RichTextField: React.FC<RichTextFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder = 'Start typing...',
  fullWidth = true,
  height = 200,
  tooltip,
  status,
  modules,
  formats,
  showCharCount = false,
  maxLength,
}) => {
  const quillRef = useRef<ReactQuill>(null)

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckIcon color="success" fontSize="small" />
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />
      case 'warning':
        return <ErrorIcon color="warning" fontSize="small" />
      case 'info':
        return <InfoIcon color="info" fontSize="small" />
      default:
        return null
    }
  }

  const defaultModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    },
  }

  const defaultFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'align', 'link', 'image', 'video'
  ]

  const handleChange = (content: string) => {
    if (maxLength && content.length > maxLength) {
      return
    }
    onChange(content)
  }

  const charCount = value ? value.replace(/<[^>]*>/g, '').length : 0

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: error ? 'error.main' : 'text.primary',
          }}
        >
          {label}
          {required && (
            <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        )}
        {getStatusIcon()}
      </Box>

      <Box
        sx={{
          '& .ql-toolbar': {
            borderTop: '1px solid #ccc',
            borderLeft: '1px solid #ccc',
            borderRight: '1px solid #ccc',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
          },
          '& .ql-container': {
            height: height,
            fontSize: '14px',
            borderBottom: '1px solid #ccc',
            borderLeft: '1px solid #ccc',
            borderRight: '1px solid #ccc',
            borderBottomLeftRadius: '4px',
            borderBottomRightRadius: '4px',
          },
          '& .ql-editor': {
            minHeight: height - 42, // Account for toolbar height
            padding: '12px 15px',
          },
          '& .ql-editor.ql-blank::before': {
            fontStyle: 'normal',
            color: 'text.secondary',
          },
          ...(error && {
            '& .ql-toolbar, & .ql-container': {
              borderColor: 'error.main',
            },
          }),
          ...(disabled && {
            '& .ql-toolbar, & .ql-container': {
              backgroundColor: 'action.disabledBackground',
              opacity: 0.6,
            },
          }),
        }}
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules || defaultModules}
          formats={formats || defaultFormats}
          placeholder={placeholder}
          readOnly={disabled}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
        <FormHelperText error={!!error} sx={{ m: 0 }}>
          {error || helperText}
        </FormHelperText>
        {showCharCount && maxLength && (
          <Typography
            variant="caption"
            color={charCount > maxLength * 0.9 ? 'warning.main' : 'text.secondary'}
          >
            {charCount}/{maxLength}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default RichTextField
