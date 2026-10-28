```powershell
$ErrorActionPreference = "Stop"

$Root = $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

# Validar estructura
foreach ($dir in @($Backend, $Frontend)) {
    if (!(Test-Path $dir -PathType Container)) {
        Write-Error "No existe: $dir"
        Read-Host "Presiona Enter para salir"
        exit 1
    }
}

# Validar pnpm
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Error "pnpm no está instalado o no está en PATH."
    Read-Host "Presiona Enter para salir"
    exit 1
}


$WezTerm = Get-Command wezterm -ErrorAction SilentlyContinue
$WindowsTerminal = Get-Command wt.exe -ErrorAction SilentlyContinue

$Services = @(
    @{ Name = "Backend"; Dir = $Backend; Cmd = "pnpm dev" },
    @{ Name = "Frontend"; Dir = $Frontend; Cmd = "pnpm dev" },
    @{ Name = "Prisma Studio"; Dir = $Backend; Cmd = "pnpm exec prisma studio" }
)

if ($WezTerm) {
    Start-Process $WezTerm.Source -ArgumentList @(
        "start", "--cwd", $Backend, "--",
        "cmd.exe", "/k", "pnpm dev"
    )

    $Ready = $false

    for ($i = 0; $i -lt 40; $i++) {
        Start-Sleep -Milliseconds 250
        & $WezTerm.Source cli list 2>$null | Out-Null

        if ($LASTEXITCODE -eq 0) {
            $Ready = $true
            break
        }
    }

    if (!$Ready) {
        Write-Error "WezTerm se inició, pero su CLI no está disponible."
        exit 1
    }

    & $WezTerm.Source cli spawn --cwd $Frontend -- cmd.exe /k "pnpm dev" | Out-Null
    & $WezTerm.Source cli spawn --cwd $Backend -- cmd.exe /k "pnpm exec prisma studio" | Out-Null

    exit 0
}

if ($WindowsTerminal) {
    $Args = @(
        "-w", "new",
        "new-tab", "--title", "Backend", "-d", $Backend,
        "cmd.exe", "/k", "pnpm dev",
        ";",
        "new-tab", "--title", "Frontend", "-d", $Frontend,
        "cmd.exe", "/k", "pnpm dev",
        ";",
        "new-tab", "--title", "Prisma Studio", "-d", $Backend,
        "cmd.exe", "/k", "pnpm exec prisma studio"
    )

    Start-Process $WindowsTerminal.Source -ArgumentList $Args
    exit 0
}


Write-Warning "No se encontró WezTerm ni Windows Terminal. Se abrirán ventanas CMD."

Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$Backend`" && pnpm dev"
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$Frontend`" && pnpm dev"
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$Backend`" && pnpm exec prisma studio"
```