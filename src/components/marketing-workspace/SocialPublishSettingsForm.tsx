import React, { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { marketingWorkspaceApi } from '../../services/api/marketingWorkspace.api'
import type { MarketingSocialPublishSettingsDto } from '../../types/marketingWorkspace.types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { useToast } from '../ui/use-toast'

function ChannelBadge({ label, on }: { label: string; on: boolean }) {
  return (
    <Badge variant={on ? 'default' : 'secondary'} className="font-normal">
      {label}: {on ? 'ready' : 'off'}
    </Badge>
  )
}

export function SocialPublishSettingsForm({ className }: { className?: string }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [summary, setSummary] = useState<MarketingSocialPublishSettingsDto | null>(null)

  const [linkedInAuthorUrn, setLinkedInAuthorUrn] = useState('')
  const [metaPageId, setMetaPageId] = useState('')
  const [metaIgUserId, setMetaIgUserId] = useState('')
  const [redditSubreddit, setRedditSubreddit] = useState('')
  const [redditUserAgent, setRedditUserAgent] = useState('')
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('')
  const [whatsappTo, setWhatsappTo] = useState('')

  const [linkedInToken, setLinkedInToken] = useState('')
  const [metaPageToken, setMetaPageToken] = useState('')
  const [redditToken, setRedditToken] = useState('')
  const [whatsappToken, setWhatsappToken] = useState('')

  const [clearLinkedIn, setClearLinkedIn] = useState(false)
  const [clearMeta, setClearMeta] = useState(false)
  const [clearReddit, setClearReddit] = useState(false)
  const [clearWhatsapp, setClearWhatsapp] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await marketingWorkspaceApi.getSocialPublishSettings()
      setSummary(data)
      setLinkedInAuthorUrn(data.linkedInAuthorUrn)
      setMetaPageId(data.metaPageId)
      setMetaIgUserId(data.metaIgUserId)
      setRedditSubreddit(data.redditSubreddit)
      setRedditUserAgent(data.redditUserAgent)
      setWhatsappPhoneNumberId(data.whatsappPhoneNumberId)
      setWhatsappTo(data.whatsappTo)
      setLinkedInToken('')
      setMetaPageToken('')
      setRedditToken('')
      setWhatsappToken('')
      setClearLinkedIn(false)
      setClearMeta(false)
      setClearReddit(false)
      setClearWhatsapp(false)
    } catch (e) {
      toast({
        title: 'Could not load',
        description: e instanceof Error ? e.message : 'Request failed',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    try {
      setSaving(true)
      const body: Record<string, unknown> = {
        linkedInAuthorUrn: linkedInAuthorUrn.trim() || null,
        metaPageId: metaPageId.trim() || null,
        metaIgUserId: metaIgUserId.trim() || null,
        redditSubreddit: redditSubreddit.trim() || null,
        redditUserAgent: redditUserAgent.trim() || null,
        whatsappPhoneNumberId: whatsappPhoneNumberId.trim() || null,
        whatsappTo: whatsappTo.trim() || null,
      }
      if (clearLinkedIn) body.linkedInAccessToken = null
      else if (linkedInToken.trim()) body.linkedInAccessToken = linkedInToken.trim()
      if (clearMeta) body.metaPageAccessToken = null
      else if (metaPageToken.trim()) body.metaPageAccessToken = metaPageToken.trim()
      if (clearReddit) body.redditAccessToken = null
      else if (redditToken.trim()) body.redditAccessToken = redditToken.trim()
      if (clearWhatsapp) body.whatsappAccessToken = null
      else if (whatsappToken.trim()) body.whatsappAccessToken = whatsappToken.trim()

      const data = await marketingWorkspaceApi.putSocialPublishSettings(body)
      setSummary(data)
      setLinkedInToken('')
      setMetaPageToken('')
      setRedditToken('')
      setWhatsappToken('')
      setClearLinkedIn(false)
      setClearMeta(false)
      setClearReddit(false)
      setClearWhatsapp(false)
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Request failed',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading && !summary) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className ?? ''}`}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading live publish settings…
      </div>
    )
  }

  const cfg = summary?.configured

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap gap-2">
        <ChannelBadge label="LinkedIn" on={Boolean(cfg?.linkedIn)} />
        <ChannelBadge label="Facebook Page" on={Boolean(cfg?.metaFacebook)} />
        <ChannelBadge label="Instagram" on={Boolean(cfg?.instagram)} />
        <ChannelBadge label="Reddit" on={Boolean(cfg?.reddit)} />
        <ChannelBadge label="WhatsApp" on={Boolean(cfg?.whatsapp)} />
        {summary ? (
          <Badge variant="outline" className="font-normal">
            Scope: {summary.scope}
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">LinkedIn</CardTitle>
            <CardDescription>REST posts API — author URN and access token.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ms-li-urn">Author URN</Label>
              <Input
                id="ms-li-urn"
                className="font-mono text-xs"
                value={linkedInAuthorUrn}
                onChange={(e) => setLinkedInAuthorUrn(e.target.value)}
                placeholder="urn:li:person:…"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="ms-li-tok">Access token</Label>
                {summary?.secretsSaved.linkedInAccessToken ? (
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setClearLinkedIn((c) => !c)}>
                    {clearLinkedIn ? 'Undo clear' : 'Remove saved'}
                  </Button>
                ) : null}
              </div>
              <Input
                id="ms-li-tok"
                type="password"
                autoComplete="off"
                value={linkedInToken}
                onChange={(e) => {
                  setLinkedInToken(e.target.value)
                  setClearLinkedIn(false)
                }}
                placeholder={summary?.secretsSaved.linkedInAccessToken ? 'Paste new token to replace' : 'Paste access token'}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Meta — Facebook Page &amp; Instagram</CardTitle>
            <CardDescription>Page ID, IG user id, and Page access token (Graph).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ms-pid">Page ID</Label>
              <Input id="ms-pid" value={metaPageId} onChange={(e) => setMetaPageId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ms-ig">Instagram user ID</Label>
              <Input id="ms-ig" value={metaIgUserId} onChange={(e) => setMetaIgUserId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="ms-ptok">Page access token</Label>
                {summary?.secretsSaved.metaPageAccessToken ? (
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setClearMeta((c) => !c)}>
                    {clearMeta ? 'Undo clear' : 'Remove saved'}
                  </Button>
                ) : null}
              </div>
              <Input
                id="ms-ptok"
                type="password"
                autoComplete="off"
                value={metaPageToken}
                onChange={(e) => {
                  setMetaPageToken(e.target.value)
                  setClearMeta(false)
                }}
                placeholder={summary?.secretsSaved.metaPageAccessToken ? 'Paste new token' : 'Paste token'}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reddit</CardTitle>
            <CardDescription>OAuth token with submit scope, subreddit name (no r/), user-agent string.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ms-rsr">Subreddit</Label>
              <Input id="ms-rsr" value={redditSubreddit} onChange={(e) => setRedditSubreddit(e.target.value)} placeholder="YourBrand" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ms-rua">User-Agent</Label>
              <Input
                id="ms-rua"
                className="font-mono text-xs"
                value={redditUserAgent}
                onChange={(e) => setRedditUserAgent(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="ms-rtok">Access token</Label>
                {summary?.secretsSaved.redditAccessToken ? (
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setClearReddit((c) => !c)}>
                    {clearReddit ? 'Undo clear' : 'Remove saved'}
                  </Button>
                ) : null}
              </div>
              <Input
                id="ms-rtok"
                type="password"
                autoComplete="off"
                value={redditToken}
                onChange={(e) => {
                  setRedditToken(e.target.value)
                  setClearReddit(false)
                }}
                placeholder={summary?.secretsSaved.redditAccessToken ? 'Paste new token' : 'Paste token'}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">WhatsApp Cloud</CardTitle>
            <CardDescription>Phone number ID, token, and recipients (comma, semicolon, or newline).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ms-wpn">Phone number ID</Label>
              <Input id="ms-wpn" value={whatsappPhoneNumberId} onChange={(e) => setWhatsappPhoneNumberId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="ms-wtok">Access token</Label>
                {summary?.secretsSaved.whatsappAccessToken ? (
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setClearWhatsapp((c) => !c)}>
                    {clearWhatsapp ? 'Undo clear' : 'Remove saved'}
                  </Button>
                ) : null}
              </div>
              <Input
                id="ms-wtok"
                type="password"
                autoComplete="off"
                value={whatsappToken}
                onChange={(e) => {
                  setWhatsappToken(e.target.value)
                  setClearWhatsapp(false)
                }}
                placeholder={summary?.secretsSaved.whatsappAccessToken ? 'Paste new token' : 'Paste token'}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ms-wto">Recipients (E.164)</Label>
              <Textarea
                id="ms-wto"
                className="min-h-[72px] font-mono text-xs"
                value={whatsappTo}
                onChange={(e) => setWhatsappTo(e.target.value)}
                placeholder={'15551234567\n918012345678'}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            'Save live publish settings'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading || saving}>
          Reload
        </Button>
      </div>
    </div>
  )
}
