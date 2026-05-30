# Targeted sweep for the provider-entity components folder (was wrongly excluded
# in the first sweep alongside the platform Toast/Loading providers).
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$srcDir = Join-Path $root 'src'

# Only entity-provider components (not Toast/Loading platform providers)
$entityProviderFiles = @(
  'ProviderTable.tsx',
  'ProviderFilters.tsx',
  'ProviderFormDialog.tsx',
  'ProviderDetailsDialog.tsx',
  'VerificationStatusDialog.tsx',
  'DeleteProviderDialog.tsx',
  'ProviderStatsWidget.tsx',
  'BulkActions.tsx'
) | ForEach-Object { Join-Path $srcDir "components\providers\$_" } | Where-Object { Test-Path $_ }

$rules = @(
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(green|emerald|lime|teal)-(500|600|700|800|900|950)\b';r='$1-storm-deep'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(green|emerald|lime|teal)-(300|400)\b';r='$1-storm-sea'}
  @{p='\bbg-(green|emerald|lime|teal)-(50|100|200)\b';r='bg-storm-mist/30'}
  @{p='\btext-(green|emerald|lime|teal)-(50|100|200)\b';r='text-on-ink'}
  @{p='\bborder-(green|emerald|lime|teal)-(50|100|200)\b';r='border-storm-mist/30'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(red|rose)-(500|600|700|800|900|950)\b';r='$1-destructive'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(red|rose)-(300|400)\b';r='$1-bloom-coral'}
  @{p='\bbg-(red|rose)-(50|100|200)\b';r='bg-destructive/10'}
  @{p='\btext-(red|rose)-(50|100|200)\b';r='text-destructive-foreground'}
  @{p='\bborder-(red|rose)-(50|100|200)\b';r='border-destructive/20'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(amber|yellow|orange)-(500|600|700|800|900|950)\b';r='$1-bloom-coral'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(amber|yellow|orange)-(300|400)\b';r='$1-bloom-coral'}
  @{p='\bbg-(amber|yellow|orange)-(50|100|200)\b';r='bg-bloom-rose'}
  @{p='\btext-(amber|yellow|orange)-(50|100|200)\b';r='text-bloom-deep'}
  @{p='\bborder-(amber|yellow|orange)-(50|100|200)\b';r='border-bloom-coral/40'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(blue|indigo|cyan|sky)-(500|600|700|800|900|950)\b';r='$1-primary'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(blue|indigo|cyan|sky)-(300|400)\b';r='$1-primary'}
  @{p='\bbg-(blue|indigo|cyan|sky)-(50|100|200)\b';r='bg-primary-soft'}
  @{p='\btext-(blue|indigo|cyan|sky)-(50|100|200)\b';r='text-primary-deep'}
  @{p='\bborder-(blue|indigo|cyan|sky)-(50|100|200)\b';r='border-primary/20'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(violet|purple|fuchsia|pink)-(500|600|700|800|900|950)\b';r='$1-primary-deep'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(violet|purple|fuchsia|pink)-(300|400)\b';r='$1-primary-deep'}
  @{p='\bbg-(violet|purple|fuchsia|pink)-(50|100|200)\b';r='bg-primary-soft'}
  @{p='\btext-(violet|purple|fuchsia|pink)-(50|100|200)\b';r='text-primary-deep'}
  @{p='\bborder-(violet|purple|fuchsia|pink)-(50|100|200)\b';r='border-primary/20'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(900|950)\b';r='$1-ink'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(800)\b';r='$1-ink-soft'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(700)\b';r='$1-charcoal'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(500|600)\b';r='$1-graphite'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(300|400)\b';r='$1-steel'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(100|200)\b';r='$1-fog'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(50)\b';r='$1-cloud'}
)

$totalReplacements = 0
$touchedFiles = 0
foreach ($file in $entityProviderFiles) {
  $original = Get-Content -Path $file -Raw -Encoding UTF8
  if ($null -eq $original) { continue }
  $content = $original
  $fileReplacements = 0
  foreach ($rule in $rules) {
    $matches = [System.Text.RegularExpressions.Regex]::Matches($content, $rule.p).Count
    if ($matches -gt 0) {
      $content = [System.Text.RegularExpressions.Regex]::Replace($content, $rule.p, $rule.r)
      $fileReplacements += $matches
    }
  }
  if ($content -ne $original) {
    Set-Content -Path $file -Value $content -NoNewline -Encoding UTF8
    $totalReplacements += $fileReplacements
    $touchedFiles += 1
    $rel = $file.Substring($root.Length + 1)
    Write-Host "  $rel ($fileReplacements replacements)" -ForegroundColor Green
  }
}
Write-Host ""
Write-Host "Provider-entity sweep complete: $totalReplacements replacements across $touchedFiles files." -ForegroundColor Cyan
