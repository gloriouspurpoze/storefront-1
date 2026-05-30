import React, { useState } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '../ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion'
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
    <Accordion type="single" collapsible className="mb-6 w-full">
      <AccordionItem value="homepage-block-library" className="rounded-md border px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="text-left">
            <p className="text-sm font-bold">Section block library (schema-based)</p>
            <p className="text-sm font-normal text-muted-foreground">
              Each homepage section type expects a defined content shape on the public site—no free-form page
              builder.
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="mb-3 rounded-md border border-primary/20 bg-primary-soft p-3 text-sm dark:border-primary/50 dark:bg-primary/40">
            Use these schemas when syncing CMS with your storefront. Apply presets below as API payloads or seed
            scripts.
          </div>
          <div className="mb-4 flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Copy className="h-4 w-4" />}
              className="w-fit"
              onClick={() => void copy('bundle', JSON.stringify(getHomepagePresetBundle(), null, 2))}
            >
              Copy full preset bundle (JSON)
            </Button>
            {copied === 'bundle' && (
              <p className="text-xs font-medium text-storm-deep dark:text-storm-deep">Copied preset bundle.</p>
            )}
            {copied === 'error' && (
              <p className="text-xs font-medium text-destructive">Clipboard unavailable.</p>
            )}
          </div>
          <Accordion type="multiple" className="w-full space-y-2">
            {HOMEPAGE_BLOCK_LIBRARY.map((block) => (
              <AccordionItem key={block.type} value={block.type} className="rounded-md border px-3">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="text-left">
                    <p className="text-sm font-semibold">
                      {block.label}{' '}
                      <span className="font-normal text-xs text-primary">({block.type})</span>
                    </p>
                    <p className="text-xs font-normal text-muted-foreground">{block.description}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2 pb-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto justify-start px-2"
                      leftIcon={<Copy className="h-4 w-4" />}
                      onClick={() =>
                        void copy(block.type, JSON.stringify(block.contentSchema, null, 2))
                      }
                    >
                      Copy content schema
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto justify-start px-2"
                      leftIcon={<Copy className="h-4 w-4" />}
                      onClick={() =>
                        void copy(
                          `${block.type}-preset`,
                          JSON.stringify(block.defaultSnippet, null, 2),
                        )
                      }
                    >
                      Copy default snippet
                    </Button>
                    <pre className="max-h-[220px] overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
                      {JSON.stringify(block.contentSchema, null, 2)}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
