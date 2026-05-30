# design-md-hex-sweep.ps1
# Replace common Material Design hex codes with DESIGN.md equivalents in product code.
# Excludes:
#  - src/lib/chartPalette.ts (source of truth)
#  - src/index.css (CSS variable definitions)
#  - src/components/layout/FixerLogoMark.tsx (literal DESIGN.md tokens with comments)
#  - src/components/blog/* (Google SERP brand colors; readability overlay tokens already explicit)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$srcDir = Join-Path $root 'src'

$cleanedPaths = @(
  'lib\chartPalette.ts',
  'index.css',
  'components\layout\FixerLogoMark.tsx',
  'components\blog'
) | ForEach-Object { Join-Path $srcDir $_ }

$files = Get-ChildItem -Path $srcDir -Recurse -File -Include *.tsx,*.ts,*.css |
  Where-Object {
    $f = $_.FullName
    -not ($cleanedPaths | Where-Object { $f.StartsWith($_, [System.StringComparison]::OrdinalIgnoreCase) })
  }

# Map: Material Design (or legacy) hex -> DESIGN.md hex
# Use lowercase keys and match case-insensitively in replacement.
$map = [ordered]@{
  # === Orange / Amber family -> bloom-coral / bloom-deep ===
  '#ff9800' = '#ff5050'  # MD Orange 500 -> bloom-coral
  '#f57c00' = '#b3262b'  # MD Orange 700 -> bloom-deep
  '#ffa726' = '#ff5050'
  '#fb8c00' = '#b3262b'
  '#ef6c00' = '#5a1313'  # MD Orange 800 -> bloom-wine
  '#e65100' = '#5a1313'  # MD Orange 900
  '#fff3e0' = '#f9d4d2'  # MD Orange 50 -> bloom-rose
  '#ffe0b2' = '#f9d4d2'  # MD Orange 100

  # === Yellow / Amber -> bloom-coral ===
  '#fbc02d' = '#ff5050'  # MD Yellow 700
  '#f9a825' = '#b3262b'  # MD Yellow 800
  '#fdd835' = '#ff5050'  # MD Yellow 600

  # === Red family -> destructive (bloom-deep) / bloom-wine ===
  '#f44336' = '#b3262b'  # MD Red 500 -> bloom-deep
  '#e53935' = '#b3262b'  # MD Red 600
  '#d32f2f' = '#5a1313'  # MD Red 700 -> bloom-wine
  '#c62828' = '#5a1313'  # MD Red 800
  '#b71c1c' = '#5a1313'  # MD Red 900
  '#ffebee' = '#f9d4d2'  # MD Red 50 -> bloom-rose
  '#ffcdd2' = '#f9d4d2'  # MD Red 100

  # === Blue family -> primary / primary-bright / primary-deep ===
  '#2196f3' = '#024ad8'  # MD Blue 500 -> primary (HP Electric Blue)
  '#1e88e5' = '#024ad8'  # MD Blue 600
  '#1976d2' = '#0e3191'  # MD Blue 700 -> primary-deep
  '#1565c0' = '#0e3191'  # MD Blue 800
  '#0d47a1' = '#0e3191'  # MD Blue 900
  '#42a5f5' = '#296ef9'  # MD Blue 400 -> primary-bright
  '#64b5f6' = '#296ef9'  # MD Blue 300
  '#90caf9' = '#c9e0fc'  # MD Blue 200 -> primary-soft
  '#bbdefb' = '#c9e0fc'  # MD Blue 100 -> primary-soft
  '#e3f2fd' = '#c9e0fc'  # MD Blue 50 -> primary-soft

  # Tailwind-style blue (legacy)
  '#2563eb' = '#024ad8'  # tw blue-600 -> primary
  '#3b82f6' = '#024ad8'  # tw blue-500
  '#1d4ed8' = '#0e3191'  # tw blue-700
  '#1e40af' = '#0e3191'  # tw blue-800
  '#1e3a8a' = '#0e3191'  # tw blue-900
  '#eff6ff' = '#c9e0fc'  # tw blue-50

  # === Cyan family -> primary-bright / primary ===
  '#00acc1' = '#296ef9'  # MD Cyan 600
  '#0097a7' = '#024ad8'  # MD Cyan 700
  '#00838f' = '#0e3191'  # MD Cyan 800
  '#006064' = '#0e3191'  # MD Cyan 900
  '#26c6da' = '#296ef9'  # MD Cyan 400
  '#4dd0e1' = '#8ebdce'  # MD Cyan 300 -> storm-mist
  '#80deea' = '#8ebdce'  # MD Cyan 200
  '#b2ebf2' = '#c9e0fc'  # MD Cyan 100
  '#e0f7fa' = '#c9e0fc'  # MD Cyan 50

  # Tailwind sky/cyan
  '#0ea5e9' = '#024ad8'  # tw sky-500 -> primary
  '#06b6d4' = '#296ef9'  # tw cyan-500 -> primary-bright

  # === Indigo / Violet / Purple family -> primary-deep ===
  '#9c27b0' = '#0e3191'  # MD Purple 500
  '#7b1fa2' = '#0e3191'  # MD Purple 700
  '#673ab7' = '#0e3191'  # MD Deep Purple
  '#512da8' = '#0e3191'
  '#311b92' = '#0e3191'
  '#5e35b1' = '#0e3191'
  '#7c4dff' = '#0e3191'
  '#3f51b5' = '#0e3191'  # MD Indigo 500
  '#303f9f' = '#0e3191'  # MD Indigo 700
  '#283593' = '#0e3191'  # MD Indigo 800
  '#1a237e' = '#0e3191'  # MD Indigo 900
  '#f3e5f5' = '#c9e0fc'  # MD Purple 50 -> primary-soft
  '#e1bee7' = '#c9e0fc'  # MD Purple 100

  # Tailwind violet/purple/indigo
  '#7c3aed' = '#0e3191'  # tw violet-600
  '#8b5cf6' = '#0e3191'  # tw violet-500
  '#6366f1' = '#0e3191'  # tw indigo-500
  '#4f46e5' = '#0e3191'  # tw indigo-600
  '#4338ca' = '#0e3191'  # tw indigo-700
  '#5b21b6' = '#0e3191'  # tw purple-800

  # === Pink / Rose / Magenta family -> bloom-coral / bloom-deep ===
  '#e91e63' = '#b3262b'  # MD Pink 500 -> bloom-deep
  '#d81b60' = '#b3262b'
  '#c2185b' = '#5a1313'
  '#ad1457' = '#5a1313'
  '#ec407a' = '#ff5050'  # MD Pink 400 -> bloom-coral
  '#f06292' = '#ff5050'  # MD Pink 300
  '#f48fb1' = '#f9d4d2'  # MD Pink 200 -> bloom-rose
  '#f8bbd0' = '#f9d4d2'  # MD Pink 100
  '#fce4ec' = '#f9d4d2'  # MD Pink 50

  # === Green family -> storm-deep ===
  '#4caf50' = '#356373'  # MD Green 500 -> storm-deep
  '#43a047' = '#356373'
  '#388e3c' = '#356373'  # MD Green 700
  '#2e7d32' = '#356373'  # MD Green 800
  '#1b5e20' = '#356373'  # MD Green 900
  '#66bb6a' = '#7fadbe'  # MD Green 400 -> storm-sea
  '#81c784' = '#7fadbe'  # MD Green 300
  '#a5d6a7' = '#8ebdce'  # MD Green 200 -> storm-mist
  '#c8e6c9' = '#8ebdce'  # MD Green 100
  '#e8f5e9' = '#8ebdce'  # MD Green 50

  # Tailwind green/emerald
  '#22c55e' = '#356373'  # tw green-500
  '#16a34a' = '#356373'  # tw green-600
  '#15803d' = '#356373'  # tw green-700
  '#10b981' = '#356373'  # tw emerald-500
  '#059669' = '#356373'  # tw emerald-600
  '#047857' = '#356373'  # tw emerald-700
  '#84cc16' = '#356373'  # tw lime-500
  '#bbf7d0' = '#8ebdce'  # tw green-200
  '#dcfce7' = '#8ebdce'  # tw green-100
  '#f0fdf4' = '#8ebdce'  # tw green-50

  # Teal MD -> storm-deep
  '#009688' = '#356373'  # MD Teal 500
  '#00796b' = '#356373'  # MD Teal 700
  '#00695c' = '#356373'  # MD Teal 800
  '#004d40' = '#356373'  # MD Teal 900
  '#00897b' = '#356373'  # MD Teal 600
  '#26a69a' = '#7fadbe'  # MD Teal 400 -> storm-sea
  '#4db6ac' = '#7fadbe'  # MD Teal 300
  '#80cbc4' = '#8ebdce'  # MD Teal 200
  '#b2dfdb' = '#8ebdce'  # MD Teal 100
  '#e0f2f1' = '#8ebdce'  # MD Teal 50

  # === Tailwind yellow/amber to bloom ===
  '#eab308' = '#ff5050'  # yellow-500
  '#ca8a04' = '#b3262b'  # yellow-600
  '#f59e0b' = '#ff5050'  # amber-500
  '#d97706' = '#b3262b'  # amber-600
  '#b45309' = '#5a1313'  # amber-700
  '#fbbf24' = '#ff5050'  # amber-400
  '#fde047' = '#ff5050'  # yellow-300
  '#fef9c3' = '#f9d4d2'  # yellow-100
  '#fef9e7' = '#f9d4d2'
  '#fefce8' = '#f9d4d2'  # yellow-50
  '#fff7ed' = '#f9d4d2'  # orange-50

  # === Tailwind red/rose ===
  '#ef4444' = '#b3262b'  # red-500
  '#dc2626' = '#b3262b'  # red-600
  '#b91c1c' = '#5a1313'  # red-700
  '#991b1b' = '#5a1313'  # red-800
  '#fee2e2' = '#f9d4d2'  # red-100
  '#fef2f2' = '#f9d4d2'  # red-50
  '#fca5a5' = '#f9d4d2'  # red-300

  # === Slate / Gray family -> ink scale ===
  '#0f172a' = '#1a1a1a'  # slate-900 -> ink
  '#1e293b' = '#292929'  # slate-800 -> ink-soft
  '#334155' = '#3d3d3d'  # slate-700 -> charcoal
  '#475569' = '#3d3d3d'  # slate-600 -> charcoal (UI text)
  '#64748b' = '#636363'  # slate-500 -> graphite
  '#94a3b8' = '#c2c2c2'  # slate-400 -> steel
  '#cbd5e1' = '#c2c2c2'  # slate-300 -> steel
  '#e2e8f0' = '#e8e8e8'  # slate-200 -> hairline
  '#f1f5f9' = '#e8e8e8'  # slate-100
  '#f8fafc' = '#f7f7f7'  # slate-50 -> cloud
  '#f5f7fa' = '#f7f7f7'

  '#111827' = '#1a1a1a'  # gray-900
  '#1f2937' = '#292929'  # gray-800
  '#374151' = '#3d3d3d'  # gray-700
  '#4b5563' = '#3d3d3d'  # gray-600
  '#6b7280' = '#636363'  # gray-500
  '#9ca3af' = '#c2c2c2'  # gray-400
  '#d1d5db' = '#c2c2c2'  # gray-300
  '#e5e7eb' = '#e8e8e8'  # gray-200
  '#f3f4f6' = '#e8e8e8'  # gray-100
  '#f9fafb' = '#f7f7f7'  # gray-50

  # === Gradient pair: indigo/purple "667eea"/"764ba2" -> primary/primary-deep ===
  '#667eea' = '#024ad8'
  '#764ba2' = '#0e3191'

  # === Pink/coral gradient pair ===
  '#f093fb' = '#ff5050'
  '#f5576c' = '#b3262b'

  # === Cyan/teal gradient pair ===
  '#4facfe' = '#296ef9'
  '#00f2fe' = '#024ad8'

  # === Green gradient pair ===
  '#43e97b' = '#7fadbe'
  '#38f9d7' = '#356373'

  # === Misc cyan/teal ===
  '#5dade2' = '#296ef9'
}

# Case-insensitive replacement using a single regex per file.
# Build a giant alternation regex.
$keys = $map.Keys | ForEach-Object { [regex]::Escape($_) }
$bigPattern = '(?i)(' + ($keys -join '|') + ')'

$totalReplacements = 0
$touchedFiles = 0

foreach ($file in $files) {
  $original = Get-Content -Path $file.FullName -Raw -Encoding UTF8
  if ($null -eq $original) { continue }
  $content = [System.Text.RegularExpressions.Regex]::Replace(
    $original,
    $bigPattern,
    {
      param($m)
      $needle = $m.Value.ToLower()
      $value = $map[$needle]
      if ($null -eq $value) { return $m.Value }
      # Preserve original case style (if input was uppercase, use uppercase)
      if ($m.Value -ceq $m.Value.ToUpper()) { return $value.ToUpper() }
      return $value
    }
  )
  if ($content -ne $original) {
    $count = [System.Text.RegularExpressions.Regex]::Matches($original, $bigPattern).Count
    Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
    $totalReplacements += $count
    $touchedFiles += 1
    $rel = $file.FullName.Substring($root.Length + 1)
    Write-Host "  $rel ($count replacements)" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "Hex sweep complete: $totalReplacements replacements across $touchedFiles files." -ForegroundColor Cyan
