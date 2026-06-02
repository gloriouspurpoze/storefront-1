import React, { useState } from 'react'
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '../../ui'
import { Loader2, Sparkles } from 'lucide-react'
import type { StorefrontConfig, StorefrontContent } from '../../../services/api/storefrontStudio.service'

export function StorefrontAiCopySection({
  cfg,
  isSuperAdmin,
  tenantId,
  onApplyContent,
  onGenerate,
}: {
  cfg: StorefrontConfig
  isSuperAdmin: boolean
  tenantId: string
  onApplyContent: (content: StorefrontContent) => void
  onGenerate: (opts: { siteName?: string; tone?: string }) => Promise<void>
}) {
  const [tone, setTone] = useState('professional')
  const [generating, setGenerating] = useState(false)
  const content = cfg.content ?? {}

  const runGenerate = async () => {
    setGenerating(true)
    try {
      await onGenerate({
        siteName: cfg.branding?.siteName,
        tone,
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-4">
        <p className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI copy assistant
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Generates hero, about, and FAQ from your brand name and industry. Requires OPENAI_API_KEY on the API server.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 items-end">
          <div>
            <Label className="text-xs">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="playful">Playful</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={runGenerate} disabled={generating}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate all
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Hero headline</Label>
          <Input
            value={content.heroHeadline ?? ''}
            onChange={(e) => onApplyContent({ ...content, heroHeadline: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">Hero subcopy</Label>
          <Textarea
            rows={2}
            value={content.heroSubcopy ?? ''}
            onChange={(e) => onApplyContent({ ...content, heroSubcopy: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">About title</Label>
          <Input
            value={content.aboutTitle ?? ''}
            onChange={(e) => onApplyContent({ ...content, aboutTitle: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">About body</Label>
          <Textarea
            rows={4}
            value={content.aboutBody ?? ''}
            onChange={(e) => onApplyContent({ ...content, aboutBody: e.target.value })}
          />
        </div>
      </div>

      {(content.faqItems ?? []).map((item, i) => (
        <div key={i} className="rounded border border-border p-2 space-y-1">
          <Input
            value={item.question}
            onChange={(e) => {
              const faq = [...(content.faqItems ?? [])]
              faq[i] = { ...faq[i], question: e.target.value }
              onApplyContent({ ...content, faqItems: faq })
            }}
            placeholder="Question"
          />
          <Textarea
            rows={2}
            value={item.answer}
            onChange={(e) => {
              const faq = [...(content.faqItems ?? [])]
              faq[i] = { ...faq[i], answer: e.target.value }
              onApplyContent({ ...content, faqItems: faq })
            }}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onApplyContent({
            ...content,
            faqItems: [...(content.faqItems ?? []), { question: '', answer: '' }],
          })
        }
      >
        Add FAQ item
      </Button>
      {!isSuperAdmin && <p className="text-[11px] text-muted-foreground">Tenant {tenantId}</p>}
    </div>
  )
}
