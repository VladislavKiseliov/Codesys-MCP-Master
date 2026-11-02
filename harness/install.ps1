# Установка Codesys-MCP-Master для DeepSeek Harness.
#
#   powershell -ExecutionPolicy Bypass -File install.ps1
#
# Что делает:
#   1. Ставит сервер глобально через npm (последний релиз форка).
#   2. Показывает найденные установки CODESYS.
#   3. Кладёт скилл проверки codesys-sp17-check в <DSH_HOME>\skills.
#   4. Добавляет подключение MCP в профиль DeepSeek Harness (с резервной копией),
#      если его там ещё нет. С -NoProfileEdit только печатает блок для вставки.
param(
  [string]$Source = 'https://github.com/VladislavKiseliov/Codesys-MCP-Master/releases/latest/download/codesys-mcp-master.tgz',
  [string]$DshProfile = 'desktop',
  [string]$Tools = 'core,libraries,online',
  [string]$DshHome = $(if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }),
  [switch]$NoProfileEdit
)
$ErrorActionPreference = 'Stop'

function Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Fail($text) { Write-Host "ОШИБКА: $text" -ForegroundColor Red; exit 1 }

Step 'Проверяю Node.js'
$nodeVersion = $null
try { $nodeVersion = (& node -v) } catch { }
if (-not $nodeVersion) { Fail 'Node.js не найден. Установите LTS-версию с https://nodejs.org и запустите скрипт снова.' }
if ([int]($nodeVersion.TrimStart('v').Split('.')[0]) -lt 18) { Fail "Нужен Node.js 18 или новее, установлен $nodeVersion." }
Write-Host "Node.js $nodeVersion"

Step "Устанавливаю сервер: $Source"
& npm install -g $Source --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Fail 'npm install завершился с ошибкой (см. вывод выше).' }

# npm masks path parts that look like secrets ("***"), so `npm root -g` alone
# is not trusted: try the prefix locations directly, literally (no wildcards).
$roots = @()
if ($env:npm_config_prefix) { $roots += Join-Path $env:npm_config_prefix 'node_modules' }
$roots += Join-Path $env:APPDATA 'npm\node_modules'
$roots += ((& npm root -g) | Out-String).Trim()
$pkg = $null
foreach ($r in $roots) {
  if ($r -and $r -notmatch '\*' -and (Test-Path -LiteralPath (Join-Path $r 'codesys-mcp-master\dist\bin.js'))) {
    $pkg = Join-Path $r 'codesys-mcp-master'; break
  }
}
if (-not $pkg) { Fail "Сервер не найден после установки (искал в: $($roots -join '; '))." }
$bin = Join-Path $pkg 'dist\bin.js'
Write-Host "Установлено: $pkg (версия $(& node $bin --version))"

Step 'Ищу установки CODESYS'
$detect = (& node $bin --detect) | Out-String
Write-Host $detect
if ($detect -match 'Found 0') {
  Write-Host 'CODESYS не найден в Program Files. Сервер будет работать, только если указать путь вручную (--codesys-path), см. INSTALL.ru.md.' -ForegroundColor Yellow
}

Step "Копирую скилл проверки в $DshHome\skills"
$skillsDir = Join-Path $DshHome 'skills'
New-Item -ItemType Directory -Force -Path $skillsDir | Out-Null
Copy-Item -Recurse -Force (Join-Path $pkg 'harness\skills\*') $skillsDir
Write-Host 'Готово: codesys-sp17-check'

# Single-quoted YAML keeps Windows backslashes literal.
$snippet = @"
- insert:
    - id: mcp-codesys
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: codesys
        transport: stdio
        command: node
        args:
          - '$bin'
          - '--mode'
          - 'persistent'
          - '--no-auto-launch'
          - '--tools'
          - '$Tools'
        cwd: '$pkg'
        toolCallTimeoutMs: 300000
        failOnStartupError: false
"@

$patchFile = Join-Path $DshHome "profiles\$DshProfile\cordis.patch.yml"
Step "Подключаю сервер к профилю '$DshProfile'"
$printOnly = $NoProfileEdit
if (-not $printOnly -and -not (Test-Path $patchFile)) {
  Write-Host "Файл $patchFile не найден: запустите DeepSeek Harness один раз, закройте его и повторите установку. Либо вставьте блок ниже вручную." -ForegroundColor Yellow
  $printOnly = $true
}
if (-not $printOnly) {
  $current = [IO.File]::ReadAllText($patchFile)
  if ($current -match '(?m)^\s*-?\s*id:\s*mcp-codesys\s*$') {
    Write-Host 'В профиле уже есть блок mcp-codesys: файл не меняю. Чтобы обновить настройки, замените его блоком ниже.' -ForegroundColor Yellow
    $printOnly = $true
  } else {
    $backup = "$patchFile.bak-$(Get-Date -Format yyyyMMdd-HHmmss)"
    Copy-Item $patchFile $backup
    $body = ($current -split "`n" | Where-Object { $_ -notmatch '^\s*#' }) -join "`n"
    if ($body.Trim() -eq '' -or $body.Trim() -eq '[]') {
      $header = ($current -split "`n" | Where-Object { $_ -match '^\s*#' }) -join "`n"
      $new = ($header.TrimEnd() + "`n" + $snippet + "`n").TrimStart()
    } else {
      $new = $current.TrimEnd() + "`n" + $snippet + "`n"
    }
    [IO.File]::WriteAllText($patchFile, $new, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "Добавлено в $patchFile (резервная копия: $backup)"
  }
}
if ($printOnly) {
  Write-Host "`nБлок для $patchFile`:" -ForegroundColor Cyan
  Write-Host $snippet
  try { Set-Clipboard -Value $snippet; Write-Host '(блок скопирован в буфер обмена)' } catch { }
}

Step 'Дальше'
Write-Host '1. Перезапустите DeepSeek Harness.'
Write-Host '2. В новом чате напишите: «Какие версии CODESYS установлены и видишь ли ты инструменты CODESYS?»'
Write-Host '3. Инструкция по работе: INSTALL.ru.md (https://github.com/VladislavKiseliov/Codesys-MCP-Master/blob/main/INSTALL.ru.md)'
