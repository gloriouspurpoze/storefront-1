/** Form selects, button/typography polish (after IconButton pass) */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const filePath = path.join(__dirname, '../src/pages/cms/CategoryMarketingManagement.tsx')
let s = fs.readFileSync(filePath, 'utf8')

const blocks = [
  [
    `              <FormControl size="small">
                <InputLabel>Industry (catalog category)</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Industry (catalog category)"
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setLocalitySlugForKey('')
                  }}
                 
                >
                  {CMS_CATALOG_CATEGORIES.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>`,
    `              <div className="min-w-[220px] space-y-2">
                <Label htmlFor="catalog-category-select">Industry (catalog category)</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => {
                    setSelectedCategory(v)
                    setLocalitySlugForKey('')
                  }}
                >
                  <SelectTrigger id="catalog-category-select" className="h-9 w-full sm:w-[280px]">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {CMS_CATALOG_CATEGORIES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>`,
  ],
  [
    `            <FormControl size="small">
              <InputLabel>Source key</InputLabel>
              <Select
                value={duplicateSourceKey}
                label="Source key"
                onChange={(e) => setDuplicateSourceKey(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select a key…</em>
                </MenuItem>
                {Object.keys(data)
                  .sort((a, b) => a.localeCompare(b))
                  .filter((k) => k !== effectiveKey)
                  .map((k) => (
                    <MenuItem key={k} value={k}>
                      {k}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>`,
    `            <div className="min-w-[200px] space-y-2">
              <Label htmlFor="duplicate-source-select">Source key</Label>
              <Select
                value={duplicateSourceKey || '__empty__'}
                onValueChange={(v) => setDuplicateSourceKey(v === '__empty__' ? '' : v)}
              >
                <SelectTrigger id="duplicate-source-select" className="h-9 w-full sm:w-[260px]">
                  <SelectValue placeholder="Select a key…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">Select a key…</SelectItem>
                  {Object.keys(data)
                    .sort((a, b) => a.localeCompare(b))
                    .filter((k) => k !== effectiveKey)
                    .map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>`,
  ],
  [
    `                      <FormControl fullWidth size="small">
                        <InputLabel>Twitter card type</InputLabel>
                        <Select
                          label="Twitter card type"
                          value={config.technicalSeo.twitterCard || 'summary_large_image'}
                          onChange={(e) =>
                            updateTechnicalSeo({
                              twitterCard: e.target.value as TechnicalSeoCmsFields['twitterCard'],
                            })
                          }
                        >
                          <MenuItem value="summary_large_image">summary_large_image (recommended)</MenuItem>
                          <MenuItem value="summary">summary</MenuItem>
                          <MenuItem value="">Default / unset</MenuItem>
                        </Select>
                      </FormControl>`,
    `                      <div className="w-full space-y-2 sm:max-w-md">
                        <Label htmlFor="twitter-card-select">Twitter card type</Label>
                        <Select
                          value={config.technicalSeo.twitterCard ? config.technicalSeo.twitterCard : '__unset__'}
                          onValueChange={(v) =>
                            updateTechnicalSeo({
                              twitterCard: (v === '__unset__' ? '' : v) as TechnicalSeoCmsFields['twitterCard'],
                            })
                          }
                        >
                          <SelectTrigger id="twitter-card-select" className="h-9 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="summary_large_image">summary_large_image (recommended)</SelectItem>
                            <SelectItem value="summary">summary</SelectItem>
                            <SelectItem value="__unset__">Default / unset</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>`,
  ],
]

for (const [a, b] of blocks) {
  if (!s.includes(a)) console.warn('Missing block:\n', a.slice(0, 80))
  else s = s.replace(a, b)
}

s = s.replace(
  'variant="outline"\n              variant="secondary"',
  'variant="secondary"',
)

s = s.replace(
  `<Typography variant="subtitle1" fontWeight={600}>
                        Images
                      </p>`,
  `<p className="text-base font-semibold">
                        Images
                      </p>`,
)

s = s.replace(
  '<ImageIconLucide className="h-4 w-4" color="action" />',
  '<ImageIconLucide className="h-4 w-4 text-primary" />',
)

s = s.replace(/variant="text"/g, 'variant="ghost"')

fs.writeFileSync(filePath, s)
console.log('cmm-polish.mjs done')
