import React from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'

/**
 * Shared product/legal guidance for Bazaar admin screens (offers, chats, listing review).
 * Kept in sync with fixer-backend/docs/API_BAZAAR.md.
 */
export function BazaarGuidanceAccordion({
  defaultExpanded = false,
}: {
  defaultExpanded?: boolean
}) {
  return (
    <Accordion defaultExpanded={defaultExpanded} sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Operations, lifecycle & compliance</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Offer semantics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Typical lifecycle: <strong>pending</strong> → optional <strong>countered</strong> →{' '}
              <strong>accepted</strong>, <strong>declined</strong>, <strong>withdrawn</strong>, or{' '}
              <strong>expired</strong> after <code>expiresAt</code>. Settlement and fulfillment are defined by your
              product rules (pickup, delivery, off-platform payment, etc.).
            </Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Listing threads
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Each thread is scoped to a listing (see <code>metadata.listingId</code>). When a listing is removed or
              sold, archive or close threads in the backend so buyers are not misled. Message retention should match
              your privacy policy and jurisdiction.
            </Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Trust & safety
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use rate limits and abuse detection on the API for public endpoints. For moderation, wire reports to
              support or a queue; admin Bazaar screens are for <strong>visibility</strong> and export — blocking users
              or hiding listings requires backend/admin actions you control.
            </Typography>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}
