# Pass 2: handle the patterns the main sweep missed
#  - Tailwind opacity suffixes (e.g. from-indigo-50/95)
#  - Double-opacity botches (e.g. border-primary/20/80) introduced by pass 1
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$srcDir = Join-Path $root 'src'

$files = Get-ChildItem -Path $srcDir -Recurse -File -Include *.tsx,*.ts

# Rules with /N opacity suffix support. Operates on the bare color-shade,
# preserving the /N suffix.
$rules = @(
  # ---- /N opacity-suffix variants for all families ----
  # Positive family
  @{p='-(green|emerald|lime|teal)-(500|600|700|800|900|950)(/\d+)';r='-storm-deep$3'}
  @{p='-(green|emerald|lime|teal)-(300|400)(/\d+)';r='-storm-sea$3'}
  @{p='-(green|emerald|lime|teal)-(50|100|200)(/\d+)';r='-storm-mist$3'}

  # Destructive
  @{p='-(red|rose)-(500|600|700|800|900|950)(/\d+)';r='-destructive$3'}
  @{p='-(red|rose)-(300|400)(/\d+)';r='-bloom-coral$3'}
  @{p='-(red|rose)-(50|100|200)(/\d+)';r='-destructive$3'}

  # Warning
  @{p='-(amber|yellow|orange)-(500|600|700|800|900|950)(/\d+)';r='-bloom-coral$3'}
  @{p='-(amber|yellow|orange)-(300|400)(/\d+)';r='-bloom-coral$3'}
  @{p='-(amber|yellow|orange)-(50|100|200)(/\d+)';r='-bloom-rose$3'}

  # Primary/Info
  @{p='-(blue|indigo|cyan|sky)-(500|600|700|800|900|950)(/\d+)';r='-primary$3'}
  @{p='-(blue|indigo|cyan|sky)-(300|400)(/\d+)';r='-primary$3'}
  @{p='-(blue|indigo|cyan|sky)-(50|100|200)(/\d+)';r='-primary-soft$3'}

  # Violet/Purple/Pink
  @{p='-(violet|purple|fuchsia|pink)-(500|600|700|800|900|950)(/\d+)';r='-primary-deep$3'}
  @{p='-(violet|purple|fuchsia|pink)-(300|400)(/\d+)';r='-primary-deep$3'}
  @{p='-(violet|purple|fuchsia|pink)-(50|100|200)(/\d+)';r='-primary-soft$3'}

  # Grays
  @{p='-(slate|gray|zinc|neutral|stone)-(900|950)(/\d+)';r='-ink$3'}
  @{p='-(slate|gray|zinc|neutral|stone)-(800)(/\d+)';r='-ink-soft$3'}
  @{p='-(slate|gray|zinc|neutral|stone)-(700)(/\d+)';r='-charcoal$3'}
  @{p='-(slate|gray|zinc|neutral|stone)-(500|600)(/\d+)';r='-graphite$3'}
  @{p='-(slate|gray|zinc|neutral|stone)-(300|400)(/\d+)';r='-steel$3'}
  @{p='-(slate|gray|zinc|neutral|stone)-(100|200)(/\d+)';r='-fog$3'}
  @{p='-(slate|gray|zinc|neutral|stone)-(50)(/\d+)';r='-cloud$3'}

  # ---- repeats without slash (in case pass1 missed some due to slash adjacency or word-boundary edge cases) ----
  @{p='\b(ring|shadow)-(green|emerald|lime|teal)-(300|400|500|600|700|800|900)\b';r='$1-storm-deep'}
  @{p='\b(ring|shadow)-(green|emerald|lime|teal)-(50|100|200)\b';r='$1-storm-mist'}
  @{p='\b(ring|shadow)-(red|rose)-(300|400|500|600|700|800|900)\b';r='$1-destructive'}
  @{p='\b(ring|shadow)-(red|rose)-(50|100|200)\b';r='$1-destructive'}
  @{p='\b(ring|shadow)-(amber|yellow|orange)-(300|400|500|600|700|800|900)\b';r='$1-bloom-coral'}
  @{p='\b(ring|shadow)-(amber|yellow|orange)-(50|100|200)\b';r='$1-bloom-rose'}
  @{p='\b(ring|shadow)-(blue|indigo|cyan|sky)-(300|400|500|600|700|800|900)\b';r='$1-primary'}
  @{p='\b(ring|shadow)-(blue|indigo|cyan|sky)-(50|100|200)\b';r='$1-primary-soft'}
  @{p='\b(ring|shadow)-(violet|purple|fuchsia|pink)-(300|400|500|600|700|800|900)\b';r='$1-primary-deep'}
  @{p='\b(ring|shadow)-(violet|purple|fuchsia|pink)-(50|100|200)\b';r='$1-primary-soft'}
  @{p='\b(ring|shadow)-(slate|gray|zinc|neutral|stone)-(700|800|900|950)\b';r='$1-ink'}
  @{p='\b(ring|shadow)-(slate|gray|zinc|neutral|stone)-(500|600)\b';r='$1-graphite'}
  @{p='\b(ring|shadow)-(slate|gray|zinc|neutral|stone)-(50|100|200|300|400)\b';r='$1-hairline'}

  # ---- fix double-opacity botches from pass1 (e.g. border-primary/20/80 -> border-primary/20) ----
  @{p='(-(?:primary|primary-soft|primary-deep|primary-bright|ink|ink-soft|charcoal|graphite|steel|fog|cloud|hairline|storm-deep|storm-sea|storm-mist|bloom-coral|bloom-rose|bloom-deep|destructive|on-ink|on-primary|canvas|paper))/(\d+)/(\d+)';r='$1/$3'}
)

$totalReplacements = 0
$touchedFiles = 0
foreach ($file in $files) {
  $original = Get-Content -Path $file.FullName -Raw -Encoding UTF8
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
    Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
    $totalReplacements += $fileReplacements
    $touchedFiles += 1
  }
}
Write-Host "Pass 2 complete: $totalReplacements replacements across $touchedFiles files." -ForegroundColor Cyan
