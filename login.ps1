$body = Get-Content login.json -Raw
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host $response.token
} catch {
    Write-Host "Error: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Details: $($reader.ReadToEnd())"
    }
    exit 1
}
