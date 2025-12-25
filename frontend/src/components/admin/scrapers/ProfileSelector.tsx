/**
 * Component: ProfileSelector
 *
 * Seleção de perfis pré-definidos de execução.
 * Exibe cards com informações de cada perfil (scrapers, duração, custo).
 *
 * FASE 5: Frontend UI Components
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApplyProfile } from '@/lib/hooks/useScraperConfig';
import type { ScraperExecutionProfile } from '@/types/scraper-config';
import { Loader2 } from 'lucide-react';

interface ProfileSelectorProps {
  profiles: ScraperExecutionProfile[];
}

export function ProfileSelector({ profiles }: ProfileSelectorProps) {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const applyMutation = useApplyProfile();

  const handleApplyProfile = (profileId: string) => {
    applyMutation.mutate(profileId);
  };

  // Ordenar: default primeiro, depois por duração
  const sortedProfiles = [...profiles].sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return a.config.estimatedDuration - b.config.estimatedDuration;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">Perfis de Execução</h3>
          <p className="text-sm text-muted-foreground">
            Aplique perfis pré-definidos ou crie customizados
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedProfiles.map((profile) => {
          const isSelected = selectedProfile === profile.id;
          const costColor =
            profile.config.estimatedCost < 30
              ? 'text-green-600 dark:text-green-400'
              : profile.config.estimatedCost < 60
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400';

          return (
            <Card
              key={profile.id}
              className={`p-4 cursor-pointer transition-all hover:border-primary ${
                isSelected ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setSelectedProfile(profile.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{profile.displayName}</h4>
                  {profile.isDefault && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Padrão
                    </Badge>
                  )}
                </div>
                {profile.isSystem && (
                  <Badge variant="outline" className="text-xs">
                    Sistema
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-3 min-h-[40px]">
                {profile.description}
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scrapers:</span>
                  <span className="font-semibold">
                    {profile.config.minScrapers}
                    {profile.config.minScrapers !== profile.config.maxScrapers &&
                      `-${profile.config.maxScrapers}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração:</span>
                  <span className="font-semibold">~{profile.config.estimatedDuration}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo I/O:</span>
                  <span className={`font-semibold ${costColor}`}>
                    {profile.config.estimatedCost < 30
                      ? 'Baixo'
                      : profile.config.estimatedCost < 60
                        ? 'Médio'
                        : 'Alto'}
                  </span>
                </div>
              </div>

              {isSelected && (
                <Button
                  className="w-full mt-4"
                  size="sm"
                  onClick={() => handleApplyProfile(profile.id)}
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    'Aplicar Perfil'
                  )}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
