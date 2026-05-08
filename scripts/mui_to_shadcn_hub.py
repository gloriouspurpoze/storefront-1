#!/usr/bin/env python3
"""One-shot: convert professional-admin-hub remaining MUI → Tailwind/shadcn patterns."""
from pathlib import Path
import re

p = Path(__file__).resolve().parent.parent / "src/pages/professionals/professional-admin-hub.tsx"
s = p.read_text()

# --- Icon aliases (no MUI) ---
s = s.replace("BackIcon", "ArrowLeft")
s = s.replace("OpenInNewIcon", "ExternalLink")

# --- Early returns ---
s = s.replace(
    """  if (!id) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Invalid route.</Alert>
      </Box>
    )
  }""",
    """  if (!id) {
    return (
      <div className="p-2">
        <HubAlert variant="error">Invalid route.</HubAlert>
      </div>
    )
  }""",
)
s = s.replace(
    """  if (loadingPro && !professional) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
      </Box>
    )
  }""",
    """  if (loadingPro && !professional) {
    return (
      <div className="p-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse bg-primary" />
        </div>
      </div>
    )
  }""",
)
s = s.replace(
    """  if (proError || !professional) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate('/professionals')} sx={{ mb: 2 }}>
          Back to professionals
        </Button>
        <Alert severity="error">{proError || 'Professional not found'}</Alert>
      </Box>
    )
  }""",
    """  if (proError || !professional) {
    return (
      <div className="p-2">
        <Button variant="outline" className="mb-2 gap-2" onClick={() => navigate('/professionals')}>
          <ArrowLeft className="h-4 w-4" />
          Back to professionals
        </Button>
        <HubAlert variant="error">{proError || 'Professional not found'}</HubAlert>
      </div>
    )
  }""",
)

# --- Main shell: opening ---
s = s.replace(
    """  return (
    <Box sx={{ pb: 4 }}>""",
    """  return (
    <TooltipProvider>
    <div className="pb-4">""",
)

# PageHeader actions
s = s.replace(
    """        action={
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="outlined" startIcon={<ArrowLeft />} onClick={() => navigate('/professionals')}>
              List
            </Button>
            <Button variant="outlined" component={RouterLink} to="/professionals/operations">
              Workforce dashboard
            </Button>
            <Button
              variant="contained"
              component={RouterLink}
              to={`/professionals/edit/${professional._id}`}
            >
              Edit profile
            </Button>
          </Box>
        }""",
    """        action={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" asChild>
              <RouterLink to="/professionals" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                List
              </RouterLink>
            </Button>
            <Button variant="outline" asChild>
              <RouterLink to="/professionals/operations">Workforce dashboard</RouterLink>
            </Button>
            <Button asChild>
              <RouterLink to={`/professionals/edit/${professional._id}`}>Edit profile</RouterLink>
            </Button>
          </div>
        }""",
)

# Profile Paper card
old_profile = """      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          background: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : theme.palette.grey[50],
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Avatar
              src={professional.profileImage}
              alt=""
              sx={{ width: 64, height: 64, fontSize: '1.25rem' }}
            >
              {(professional.firstName?.[0] ?? '?').toUpperCase()}
              {(professional.lastName?.[0] ?? '').toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Pro ID · {professional.professionalId}
              </Typography>
              <Typography variant="body2" noWrap title={professional.email}>
                {professional.email} · {professional.phoneNumber}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.75 }}>
                <Chip
                  size="small"
                  label={`Account: ${accountStatus}`}
                  color={accountStatus === 'active' ? 'success' : 'warning'}
                />
                <Chip size="small" label={`Verification: ${professional.verificationStatus}`} />
                <Chip size="small" label={`Availability: ${professional.availability}`} />
              </Stack>
            </Box>
          </Stack>
          <Box sx={{ flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Lifecycle snapshot
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h5" component="span">
                {statusTotalsLoading ? '—' : pipelineGrandTotal ?? '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                assignments (all statuses)
              </Typography>
              <Tooltip title="Refresh stage counts">
                <Button size="small" variant="outlined" onClick={() => void loadStatusTotals()} disabled={statusTotalsLoading}>
                  Refresh
                </Button>
              </Tooltip>
            </Stack>
          </Box>
        </Stack>

        {statusTotalsError ? (
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
            Could not load assignment counts. Refresh the page or open Bookings to verify workload.
          </Alert>
        ) : null}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, mb: 1 }}>
          Counts come from bookings assigned to this professional (by status). Select a stage to jump to Bookings with
          a matching filter.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 0.5,
            '&::-webkit-scrollbar': { height: 6 },
          }}
        >
          {PIPELINE_GROUPS.map((group) => {
            const count = sumStatusesForGroup(statusTotals, group.statuses)
            return (
              <Tooltip key={group.id} title={group.description}>
                <Paper
                  variant="outlined"
                  onClick={() => handlePipelineStageClick(group)}
                  sx={{
                    minWidth: 140,
                    p: 1.25,
                    cursor: 'pointer',
                    borderRadius: 2,
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 1,
                    },
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    {group.shortLabel}
                  </Typography>
                  <Typography variant="h6">{statusTotalsLoading ? '…' : count}</Typography>
                  <Chip size="small" label={bookingLifecycleLabel(group.drilldownStatus)} sx={{ mt: 0.5 }} color={group.color} variant="outlined" />
                </Paper>
              </Tooltip>
            )
          })}
        </Box>
      </Paper>"""

new_profile = """      <Card className="mb-2 bg-muted/30">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                {professional.profileImage ? (
                  <AvatarImage src={professional.profileImage} alt="" />
                ) : null}
                <AvatarFallback className="text-lg">
                  {(professional.firstName?.[0] ?? '?').toUpperCase()}
                  {(professional.lastName?.[0] ?? '').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Pro ID · {professional.professionalId}</p>
                <p className="truncate text-sm" title={professional.email}>
                  {professional.email} · {professional.phoneNumber}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant={accountStatus === 'active' ? 'success' : 'warning'}>
                    Account: {accountStatus}
                  </Badge>
                  <Badge variant="outline">Verification: {professional.verificationStatus}</Badge>
                  <Badge variant="outline">Availability: {professional.availability}</Badge>
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <p className="mb-1 block text-xs text-muted-foreground">Lifecycle snapshot</p>
              <div className="flex flex-row items-center gap-2">
                <span className="text-2xl font-semibold tracking-tight">
                  {statusTotalsLoading ? '—' : pipelineGrandTotal ?? '—'}
                </span>
                <span className="text-sm text-muted-foreground">assignments (all statuses)</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void loadStatusTotals()}
                        disabled={statusTotalsLoading}
                      >
                        Refresh
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Refresh stage counts</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {statusTotalsError ? (
            <HubAlert variant="warning" className="mt-2">
              Could not load assignment counts. Refresh the page or open Bookings to verify workload.
            </HubAlert>
          ) : null}

          <p className="mb-2 mt-4 block text-xs text-muted-foreground">
            Counts come from bookings assigned to this professional (by status). Select a stage to jump to Bookings
            with a matching filter.
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PIPELINE_GROUPS.map((group) => {
              const count = sumStatusesForGroup(statusTotals, group.statuses)
              return (
                <Tooltip key={group.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handlePipelineStageClick(group)}
                      className="min-w-[140px] shrink-0 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:shadow-sm"
                    >
                      <span className="block text-xs text-muted-foreground">{group.shortLabel}</span>
                      <span className="text-xl font-semibold">{statusTotalsLoading ? '…' : count}</span>
                      <Badge variant={pipelineStageBadgeVariant(group.color)} className="mt-1">
                        {bookingLifecycleLabel(group.drilldownStatus)}
                      </Badge>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{group.description}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </CardContent>
      </Card>"""

if old_profile not in s:
    raise SystemExit("profile block not found — file changed")
s = s.replace(old_profile, new_profile)

# Tabs: MUI → radix
old_tabs = """      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as TabKey)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label="Overview" value="overview" />
        <Tab label="Bookings" value="bookings" />
        <Tab label="Activity" value="activity" />
        <Tab label="Earnings" value="earnings" />
        <Tab label="Reviews" value="reviews" />
        <Tab label="Documents" value="documents" />
        <Tab label="Coverage" value="coverage" />
        <Tab label="Moderation" value="moderation" />
      </Tabs>"""

new_tabs = """      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mb-2 w-full">
        <div className="overflow-x-auto border-b border-border">
          <TabsList className="inline-flex h-auto min-h-10 w-max min-w-full flex-wrap justify-start gap-1 rounded-none bg-transparent p-0">
            <TabsTrigger value="overview" className="shrink-0">
              Overview
            </TabsTrigger>
            <TabsTrigger value="bookings" className="shrink-0">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="activity" className="shrink-0">
              Activity
            </TabsTrigger>
            <TabsTrigger value="earnings" className="shrink-0">
              Earnings
            </TabsTrigger>
            <TabsTrigger value="reviews" className="shrink-0">
              Reviews
            </TabsTrigger>
            <TabsTrigger value="documents" className="shrink-0">
              Documents
            </TabsTrigger>
            <TabsTrigger value="coverage" className="shrink-0">
              Coverage
            </TabsTrigger>
            <TabsTrigger value="moderation" className="shrink-0">
              Moderation
            </TabsTrigger>
          </TabsList>
        </div>"""

if old_tabs not in s:
    raise SystemExit("tabs block not found")
s = s.replace(old_tabs, new_tabs)

p.write_text(s)
print("ok")
