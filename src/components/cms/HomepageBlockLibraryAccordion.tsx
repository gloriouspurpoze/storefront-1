import React, { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon, ContentCopy as CopyIcon } from '@mui/icons-material'
import { HOMEPAGE_BLOCK_LIBRARY, getHomepagePresetBundle } from '../../lib/homepageSectionBlockLibrary'

export function HomepageBlockLibraryAccordion() {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopied('error')
    }
  }

  return (
    <Accordion defaultExpanded={false} sx={{ mb: 3 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Section block library (schema-based)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Each homepage section type expects a defined content shape on the public site—no free-form page builder.
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Alert severity="info" sx={{ mb: 2 }}>
          Use these schemas when syncing CMS with your storefront. Apply presets below as API payloads or seed scripts.
        </Alert>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={() =>
              void copy(
                'bundle',
                JSON.stringify(getHomepagePresetBundle(), null, 2),
              )
            }
          >
            Copy full preset bundle (JSON)
          </Button>
          {copied === 'bundle' && (
            <Typography variant="caption" color="success.main">
              Copied preset bundle.
            </Typography>
          )}
          {copied === 'error' && (
            <Typography variant="caption" color="error">
              Clipboard unavailable.
            </Typography>
          )}
        </Stack>
        <Stack spacing={1}>
          {HOMEPAGE_BLOCK_LIBRARY.map((block) => (
            <Accordion key={block.type} disableGutters elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {block.label}{' '}
                    <Typography component="span" variant="caption" color="primary">
                      ({block.type})
                    </Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {block.description}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<CopyIcon />}
                    onClick={() =>
                      void copy(
                        block.type,
                        JSON.stringify(block.contentSchema, null, 2),
                      )
                    }
                  >
                    Copy content schema
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<CopyIcon />}
                    onClick={() =>
                      void copy(
                        `${block.type}-preset`,
                        JSON.stringify(block.defaultSnippet, null, 2),
                      )
                    }
                  >
                    Copy default snippet
                  </Button>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      maxHeight: 220,
                      overflow: 'auto',
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      fontSize: '0.75rem',
                    }}
                  >
                    {JSON.stringify(block.contentSchema, null, 2)}
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}
