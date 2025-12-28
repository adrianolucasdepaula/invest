$token = Get-Content fresh_token.txt -Raw
$token = $token.Trim()

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    ticker = "PETR4"
} | ConvertTo-Json

Write-Host "Testing PETR4 update..."
$response = Invoke-RestMethod -Uri "http://localhost:3101/api/v1/assets/updates/single" -Method POST -Headers $headers -Body $body

Write-Host "Response:"
$response | ConvertTo-Json -Depth 10
