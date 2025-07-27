param(
  [string]$InputFile = "../frontend/input.json",
  [string]$OutputFile = "../frontend/output-vc.json"
)

$input = Get-Content $InputFile -Raw
$jwk   = Get-Content ".\issuer.jwk" -Raw

$vc = didkit generate-credential `
        --jwk $jwk `
        --base-url "http://localhost:3000" `
        --issuance-date (Get-Date -Format o) `
        --expiration-date ((Get-Date).AddHours(24).ToString("o")) `
        --format "ldp_vc" `
        --proof-purpose "assertionMethod" `
        --input $input

$vc | Out-File $OutputFile -Encoding utf8
Write-Host "✅ VC 발행 완료 → $OutputFile"
Get-Content .\output-vc.json | Write-Output