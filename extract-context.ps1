# Extrator de Contexto das Sessões do Claude Code
param(
    [string]$SessionId,
    [int]$LastMessages = 10
)

$baseDir = "$env:USERPROFILE\.claude\projects\C--Users-adria-Dropbox-PC--2--Downloads-Python---Projetos-invest-claude-web"

function Get-SessionSummary {
    param($FilePath, $SessionName)
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "ANÁLISE: $SessionName" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    $content = Get-Content $FilePath -Raw
    $lines = $content -split "`n"
    
    $userMessages = @()
    $assistantMessages = @()
    $toolUses = @()
    $fileEdits = @()
    
    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        
        try {
            $json = $line | ConvertFrom-Json
            
            # Mensagens do usuário
            if ($json.PSObject.Properties['type'] -and $json.type -eq 'user') {
                if ($json.PSObject.Properties['content']) {
                    foreach ($item in $json.content) {
                        if ($item.type -eq 'text' -and $item.text) {
                            $userMessages += $item.text
                        }
                    }
                }
            }
            
            # Mensagens do assistente
            if ($json.PSObject.Properties['type'] -and $json.type -eq 'assistant') {
                # Verificar se não é erro de autenticação
                if ($json.PSObject.Properties['error'] -and $json.error -eq 'authentication_failed') {
                    continue
                }
                
                if ($json.PSObject.Properties['content']) {
                    foreach ($item in $json.content) {
                        if ($item.type -eq 'text' -and $item.text) {
                            $assistantMessages += $item.text
                        }
                        elseif ($item.type -eq 'tool_use') {
                            $toolUses += @{
                                Name = $item.name
                                Input = $item.input
                            }
                            
                            # Detectar edições de arquivo
                            if ($item.name -match 'write|replace|edit') {
                                if ($item.input.PSObject.Properties['TargetFile']) {
                                    $fileEdits += $item.input.TargetFile
                                }
                            }
                        }
                    }
                }
            }
        }
        catch {
            continue
        }
    }
    
    Write-Host "📊 Estatísticas:" -ForegroundColor Yellow
    Write-Host "  - Mensagens do usuário: $($userMessages.Count)" -ForegroundColor White
    Write-Host "  - Respostas do assistente: $($assistantMessages.Count)" -ForegroundColor White
    Write-Host "  - Ferramentas usadas: $($toolUses.Count)" -ForegroundColor White
    Write-Host "  - Arquivos editados: $($fileEdits.Count)" -ForegroundColor White
    
    if ($userMessages.Count -gt 0) {
        Write-Host "`n📝 ÚLTIMAS $LastMessages MENSAGENS DO USUÁRIO:" -ForegroundColor Green
        $userMessages | Select-Object -Last $LastMessages | ForEach-Object {
            $preview = if ($_.Length -gt 200) { $_.Substring(0, 200) + "..." } else { $_ }
            Write-Host "`n  → $preview" -ForegroundColor White
        }
    }
    
    if ($assistantMessages.Count -gt 0) {
        Write-Host "`n🤖 ÚLTIMA RESPOSTA DO ASSISTENTE:" -ForegroundColor Magenta
        $last = $assistantMessages | Select-Object -Last 1
        $preview = if ($last.Length -gt 500) { $last.Substring(0, 500) + "..." } else { $last }
        Write-Host "`n  $preview`n" -ForegroundColor White
    }
    
    if ($fileEdits.Count -gt 0) {
        Write-Host "`n📁 ARQUIVOS MAIS EDITADOS:" -ForegroundColor Cyan
        $fileEdits | Group-Object | Sort-Object Count -Descending | Select-Object -First 10 | ForEach-Object {
            Write-Host "  - $($_.Name) ($($_.Count)x)" -ForegroundColor White
        }
    }
    
    return @{
        UserMessages = $userMessages
        AssistantMessages = $assistantMessages
        ToolUses = $toolUses
        FileEdits = $fileEdits
    }
}

# Processar sessões
$sessions = @(
    @{Id='10bdd602-5719-46b0-95bc-0db284e9a4a9'; Name='Sessão 1 - Mais Recente (23/11 17:47)'},
    @{Id='57d0a9b4-8abc-4869-ba8c-2a81c1fce838'; Name='Sessão 2 - Grande (23/11 04:34)'},
    @{Id='0a2eecb2-74d2-4a48-8aca-4ddd906408b7'; Name='Sessão 3 - Média (23/11 04:30)'},
    @{Id='766132f4-4846-4ee2-9f38-3dbaa479ac13'; Name='Sessão 4 - Maior (23/11 04:30)'}
)

$results = @()

foreach ($session in $sessions) {
    $file = Join-Path $baseDir "$($session.Id).jsonl"
    if (Test-Path $file) {
        $result = Get-SessionSummary -FilePath $file -SessionName $session.Name
        $results += @{
            Session = $session
            Data = $result
        }
    }
}

Write-Host "`n`n========================================" -ForegroundColor Magenta
Write-Host "RESUMO GERAL" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

foreach ($r in $results) {
    Write-Host "$($r.Session.Name):" -ForegroundColor Cyan
    Write-Host "  Mensagens: $($r.Data.UserMessages.Count) usuário / $($r.Data.AssistantMessages.Count) assistente" -ForegroundColor White
    Write-Host "  Ferramentas: $($r.Data.ToolUses.Count)" -ForegroundColor White
    Write-Host "  Arquivos: $($r.Data.FileEdits.Count)`n" -ForegroundColor White
}
