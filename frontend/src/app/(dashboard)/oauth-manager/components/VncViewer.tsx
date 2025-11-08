'use client';

export interface VncViewerProps {
  vncUrl: string;
  currentSiteName?: string;
  instructions?: string;
}

export function VncViewer({ vncUrl, currentSiteName, instructions }: VncViewerProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <div className="bg-muted p-4 border-b">
        <h3 className="font-semibold text-lg">{currentSiteName || 'Navegador Chrome'}</h3>
        {instructions && (
          <p className="text-sm text-muted-foreground mt-1">{instructions}</p>
        )}
      </div>

      <div className="relative w-full" style={{ height: '600px' }}>
        <iframe
          src={vncUrl}
          className="w-full h-full"
          allow="fullscreen"
          title="VNC Viewer - Chrome OAuth"
        />
      </div>
    </div>
  );
}
