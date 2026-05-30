# design-md-color-sweep.ps1
# ----------------------------------------------------------------------------
# Bulk mechanical replacement of off-palette Tailwind color classes with
# DESIGN.md tokens. Run from repo root:  pwsh ./scripts/design-md-color-sweep.ps1
#
# Mapping (off-palette  ->  DESIGN.md token):
#   green / emerald / lime / teal       -> storm-deep   (neutral positive)
#   red  / rose                          -> destructive  (bloom-deep)
#   amber / yellow / orange              -> bloom-coral  (sale-tag warning)
#   blue / indigo / cyan / sky           -> primary      (HP Electric Blue)
#   slate / gray / zinc / neutral / stone (dark shades 600+)  -> ink-soft / charcoal / graphite / ink
#   slate / gray / zinc / neutral / stone (light shades 50-200) -> cloud / fog / hairline
#   violet / purple / fuchsia / pink     -> primary-soft / bloom-rose (case-by-case; we map to primary-deep accent)
#
# All replacements operate on whole-word boundaries (\b) so we never partial-match.
# Replacements operate on .tsx and .ts files inside src/, excluding src/components/ui
# (already cleaned), src/components/layout (already cleaned), src/components/common
# (already cleaned), src/components/providers (already cleaned), src/shared (already
# cleaned), src/lib (mostly utilities; small risk).
# ----------------------------------------------------------------------------

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$srcDir = Join-Path $root 'src'

# Scope: everything under src/ except the already-cleaned shell.
$cleanedPaths = @(
  'components\ui',
  'components\layout',
  'components\common',
  'components\providers',
  'shared'
) | ForEach-Object { Join-Path $srcDir $_ }

$files = Get-ChildItem -Path $srcDir -Recurse -File -Include *.tsx,*.ts |
  Where-Object {
    $f = $_.FullName
    -not ($cleanedPaths | Where-Object { $f.StartsWith($_, [System.StringComparison]::OrdinalIgnoreCase) })
  }

Write-Host "Sweeping $($files.Count) files…" -ForegroundColor Cyan

# Replacement table: each entry is [regex, replacement, comment]
# Token shorthand:
#   stormDeep   = '$1-storm-deep'
#   bloomCoral  = '$1-bloom-coral'
#   bloomRose   = '$1-bloom-rose'
#   bloomDeep   = '$1-bloom-deep'
#   destructive = '$1-destructive'
#   primary     = '$1-primary'
#   primarySoft = '$1-primary-soft'
#   primaryDeep = '$1-primary-deep'
#   stormMist30 = '$1-storm-mist/30'
#   graphite    = '$1-graphite'
#   charcoal    = '$1-charcoal'
#   inkSoft     = '$1-ink-soft'
#   ink         = '$1-ink'
#   cloud       = '$1-cloud'
#   fog         = '$1-fog'
#   hairline    = '$1-hairline'

$rules = @(
  # ===== POSITIVE / SUCCESS family -> storm-deep =====
  # Deep shades (500-900) -> storm-deep
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(green|emerald|lime|teal)-(500|600|700|800|900|950)\b';r='$1-storm-deep'}
  # Mid shades (300/400) -> storm-sea
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(green|emerald|lime|teal)-(300|400)\b';r='$1-storm-sea'}
  # Light shades (50-200) -> storm-mist/30 (subtle background)
  @{p='\bbg-(green|emerald|lime|teal)-(50|100|200)\b';r='bg-storm-mist/30'}
  @{p='\btext-(green|emerald|lime|teal)-(50|100|200)\b';r='text-on-ink'}
  @{p='\bborder-(green|emerald|lime|teal)-(50|100|200)\b';r='border-storm-mist/30'}

  # ===== DESTRUCTIVE / ERROR family -> destructive (bloom-deep) =====
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(red|rose)-(500|600|700|800|900|950)\b';r='$1-destructive'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(red|rose)-(300|400)\b';r='$1-bloom-coral'}
  @{p='\bbg-(red|rose)-(50|100|200)\b';r='bg-destructive/10'}
  @{p='\btext-(red|rose)-(50|100|200)\b';r='text-destructive-foreground'}
  @{p='\bborder-(red|rose)-(50|100|200)\b';r='border-destructive/20'}

  # ===== WARNING family (amber/yellow/orange) -> bloom-coral =====
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(amber|yellow|orange)-(500|600|700|800|900|950)\b';r='$1-bloom-coral'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(amber|yellow|orange)-(300|400)\b';r='$1-bloom-coral'}
  @{p='\bbg-(amber|yellow|orange)-(50|100|200)\b';r='bg-bloom-rose'}
  @{p='\btext-(amber|yellow|orange)-(50|100|200)\b';r='text-bloom-deep'}
  @{p='\bborder-(amber|yellow|orange)-(50|100|200)\b';r='border-bloom-coral/40'}

  # ===== INFO / PRIMARY-BLUE family -> primary (HP Electric Blue) =====
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(blue|indigo|cyan|sky)-(500|600|700|800|900|950)\b';r='$1-primary'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(blue|indigo|cyan|sky)-(300|400)\b';r='$1-primary'}
  @{p='\bbg-(blue|indigo|cyan|sky)-(50|100|200)\b';r='bg-primary-soft'}
  @{p='\btext-(blue|indigo|cyan|sky)-(50|100|200)\b';r='text-primary-deep'}
  @{p='\bborder-(blue|indigo|cyan|sky)-(50|100|200)\b';r='border-primary/20'}

  # ===== VIOLET / PURPLE / FUCHSIA / PINK -> primary-deep / bloom-rose =====
  # Deep (500+) -> primary-deep (closest DESIGN.md accent)
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(violet|purple|fuchsia|pink)-(500|600|700|800|900|950)\b';r='$1-primary-deep'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder|accent|caret|decoration)-(violet|purple|fuchsia|pink)-(300|400)\b';r='$1-primary-deep'}
  @{p='\bbg-(violet|purple|fuchsia|pink)-(50|100|200)\b';r='bg-primary-soft'}
  @{p='\btext-(violet|purple|fuchsia|pink)-(50|100|200)\b';r='text-primary-deep'}
  @{p='\bborder-(violet|purple|fuchsia|pink)-(50|100|200)\b';r='border-primary/20'}

  # ===== GRAYS (slate/gray/zinc/neutral/stone) -> ink scale =====
  # Very dark (800-950) -> ink-deep / ink
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(900|950)\b';r='$1-ink'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(800)\b';r='$1-ink-soft'}
  # Mid dark (600-700) -> charcoal / graphite
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(700)\b';r='$1-charcoal'}
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(500|600)\b';r='$1-graphite'}
  # Mid light (300-400) -> steel
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(300|400)\b';r='$1-steel'}
  # Light (100-200) -> fog
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(100|200)\b';r='$1-fog'}
  # Very light (50) -> cloud
  @{p='\b(bg|text|border|ring|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone)-(50)\b';r='$1-cloud'}
)

$totalReplacements = 0
$touchedFiles = 0

foreach ($file in $files) {
  $original = Get-Content -Path $file.FullName -Raw -Encoding UTF8
  if ($null -eq $original) { continue }
  $content = $original
  $fileReplacements = 0
  foreach ($rule in $rules) {
    $newContent = [System.Text.RegularExpressions.Regex]::Replace($content, $rule.p, $rule.r)
    if ($newContent -ne $content) {
      # Count replacements crudely
      $matches = [System.Text.RegularExpressions.Regex]::Matches($content, $rule.p).Count
      $fileReplacements += $matches
      $content = $newContent
    }
  }
  if ($content -ne $original) {
    Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
    $totalReplacements += $fileReplacements
    $touchedFiles += 1
    $rel = $file.FullName.Substring($root.Length + 1)
    Write-Host "  $rel ($fileReplacements replacements)" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "Sweep complete: $totalReplacements replacements across $touchedFiles files." -ForegroundColor Cyan
