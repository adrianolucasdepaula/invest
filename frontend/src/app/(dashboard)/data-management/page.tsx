'use client';

import { SyncStatusTable } from '@/components/data-sync/SyncStatusTable';
import { BulkSyncButton } from '@/components/data-sync/BulkSyncButton';
import { IntradaySyncButton } from '@/components/data-sync/IntradaySyncButton';
import { SyncProgressBar } from '@/components/data-sync/SyncProgressBar';
import { AuditTrailPanel } from '@/components/data-sync/AuditTrailPanel';
import { useSyncHelpers } from '@/lib/hooks/useDataSync';

/**
 * Page: Data Management (Sync B3)
 *
 * Complete sync management system for B3 assets:
 * - View sync status for all 55 assets
 * - Bulk sync operations (up to 20 assets at once)
 * - Real-time progress monitoring via WebSocket
 * - Audit trail with detailed logs
 *
 * Components:
 * - SyncStatusTable: Main table with asset sync status
 * - BulkSyncButton: Trigger bulk sync modal
 * - SyncProgressBar: Real-time progress display (WebSocket)
 * - AuditTrailPanel: Detailed sync logs
 */
export default function DataManagementPage() {
  const { refetchSyncStatus } = useSyncHelpers();

  /**
   * Handle sync started
   * Refresh sync status to show updated data
   */
  const handleSyncStarted = () => {
    console.log('[DATA MANAGEMENT] Sync started, refreshing status...');
    refetchSyncStatus();
  };

  /**
   * Handle sync completed
   * Refresh sync status to show final results
   */
  const handleSyncCompleted = () => {
    console.log('[DATA MANAGEMENT] Sync completed, refreshing status...');
    refetchSyncStatus();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciamento de Dados B3
          </h1>
          <p className="text-muted-foreground">
            Gerencie e monitore a sincronização de dados históricos de todos os ativos B3
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <IntradaySyncButton onSyncCompleted={handleSyncCompleted} />
          <BulkSyncButton onSyncStarted={handleSyncStarted} />
        </div>
      </div>

      {/* Real-Time Progress Bar (only visible when sync is running) */}
      <SyncProgressBar onSyncComplete={handleSyncCompleted} autoRefresh />

      {/* Main Content: Sync Status Table */}
      <SyncStatusTable />

      {/* Audit Trail Panel */}
      <AuditTrailPanel maxHeight={400} autoScroll />
    </div>
  );
}
