# Script para extrair conversas completas das sessões do Claude Code
param(
    [string]$SessionId,
    [string]$InputDir = "C:\Users\adria\.gemini\antigravity\brain\bc07a2ed-4038-41cf-812d-d126674f8909\sessoes",
    [string]$OutputDir = "C:\Users\adria\.gemini\antigravity\brain\bc07a2ed-4038-41cf-812d-d126674f8909\conversas"
)

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

function Parse-Session {
    param([string]$FilePath, [string]$SessionName)
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Processando: $SessionName" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    $outputFile = Join-Path $OutputDir "$SessionName.md"
    $content = "# Sessão Claude Code: $SessionName`n`n"
    $content += "**Arquivo Original:** ``$FilePath```n`n"
    $content += "---`n`n"
    
    $lines = Get-Content $FilePath
    $messageCount = 0
    
    foreach ($line in $lines) {
        try {
            $json = $line | ConvertFrom-Json
            
            # Filtrar apenas mensagens de usuário e assistente
            if ($json.type -eq 'user' -or $json.type -eq 'assistant') {
                $messageCount++
                
                # Extrair role e conteúdo
                $role = if ($json.type -eq 'user') { "👤 **USUÁRIO**" } else { "🤖 **ASSISTENTE**" }
                
                # Extrair texto do conteúdo
                $text = ""
                if ($json.content) {
                    foreach ($contentItem in $json.content) {
                        if ($contentItem.type -eq 'text') {
                            $text += $contentItem.text
                        }
                        elseif ($contentItem.type -eq 'tool_use') {
                            $text += [System.Environment]::NewLine + [System.Environment]::NewLine + "**[TOOL USE: $($contentItem.name)]**" + [System.Environment]::NewLine
                            if ($contentItem.input) {
                                $text += "``````json" + [System.Environment]::NewLine + ($contentItem.input | ConvertTo-Json -Depth 5) + [System.Environment]::NewLine + "``````"
                            }
                        }
                        elseif ($contentItem.type -eq 'tool_result') {
                            $text += [System.Environment]::NewLine + [System.Environment]::NewLine + "**[TOOL RESULT]**" + [System.Environment]::NewLine
                            $text += "``````" + $contentItem.content + "``````"
                        }
                    }
                }
                
                # Adicionar ao conteúdo se houver texto
                if ($text.Trim()) {
                    $content += "## Mensagem #$messageCount - $role`n`n"
                    $content += "$text`n`n"
                    $content += "---`n`n"
                }
            }
        }
        catch {
            # Ignorar linhas que não são JSON válido
            continue
        }
    }
    
    $content += "`n`n**Total de mensagens extraídas:** $messageCount`n"
    
    # Salvar arquivo
    $content | Out-File $outputFile -Encoding UTF8
    
    Write-Host "✅ Extraídas $messageCount mensagens" -ForegroundColor Green
    Write-Host "📄 Salvo em: $outputFile`n" -ForegroundColor Yellow
    
    return $messageCount
}

# Processar todas as sessões ou uma específica
if ($SessionId) {
    $file = Join-Path $InputDir "$SessionId.jsonl"
    if (Test-Path $file) {
        Parse-Session -FilePath $file -SessionName $SessionId
    }
    else {
        Write-Host "Arquivo não encontrado: $file" -ForegroundColor Red
    }
}
else {
    $sessions = Get-ChildItem $InputDir -Filter "*.jsonl"
    $totalMessages = 0
    
    foreach ($session in $sessions) {
        $sessionName = $session.BaseName
        $count = Parse-Session -FilePath $session.FullName -SessionName $sessionName
        $totalMessages += $count
    }
    
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "RESUMO FINAL" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "Total de sessões processadas: $($sessions.Count)" -ForegroundColor White
    Write-Host "Total de mensagens extraídas: $totalMessages" -ForegroundColor White
    Write-Host "Arquivos salvos em: $OutputDir" -ForegroundColor White
}
