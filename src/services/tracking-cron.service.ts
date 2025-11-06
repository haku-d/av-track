import * as cron from 'node-cron';
import { trackingDatabaseService } from './tracking-database.service';
import { getTrackingService, isCarrierSupported, CarrierType } from './carriers/tracking-service-factory';

/**
 * Cron job service for updating tracked shipments
 * Runs every 15 minutes to update all active tracked shipments
 */
export class TrackingCronService {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  /**
   * Start the cron job
   * Runs every 15 minutes (cron: every 15 minutes)
   */
  start(): void {
    if (this.cronJob) {
      console.log('Tracking cron job is already running');
      return;
    }

    // Run every 15 minutes
    this.cronJob = cron.schedule('*/15 * * * *', async () => {
      await this.updateTrackedShipments();
    });

    console.log('✅ Tracking cron job started - will run every 15 minutes');
    
    // Run immediately on startup
    this.updateTrackedShipments().catch((error) => {
      console.error('Error in initial tracking update:', error);
    });
  }

  /**
   * Stop the cron job
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('Tracking cron job stopped');
    }
  }

  /**
   * Update all tracked shipments
   */
  async updateTrackedShipments(): Promise<void> {
    if (this.isRunning) {
      console.log('⏭️  Skipping tracking update - previous update still running');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('🔄 Starting tracking update...');

      // Get all shipments that need updating (older than 15 minutes)
      const shipmentsToUpdate = await trackingDatabaseService.getShipmentsNeedingUpdate(15);

      if (shipmentsToUpdate.length === 0) {
        console.log('✅ No shipments need updating');
        return;
      }

      console.log(`📦 Found ${shipmentsToUpdate.length} shipments to update`);

      let successCount = 0;
      let errorCount = 0;

      // Update each shipment
      for (const shipment of shipmentsToUpdate) {
        try {
          console.log(`  Updating ${shipment.service} shipment: ${shipment.trackingNo}`);

          // Check if carrier is supported
          if (!isCarrierSupported(shipment.service)) {
            console.log(`  ⏭️  Skipping ${shipment.service} shipment (not implemented)`);
            continue;
          }

          // Get the appropriate tracking service for this carrier
          const trackingService = getTrackingService(shipment.service as CarrierType);

          const trackingResult = await trackingService.trackStandardized({
            trackingIds: [shipment.trackingNo],
          });

          if (trackingResult.status === 'error') {
            // Record error
            await trackingDatabaseService.recordError(
              shipment.trackingNo,
              shipment.service,
              trackingResult.errors.join(', ')
            );
            errorCount++;
            console.log(`  ❌ Error tracking ${shipment.trackingNo}: ${trackingResult.errors.join(', ')}`);
          } else {
            // Update tracking response
            await trackingDatabaseService.updateTrackingResponse(
              shipment.trackingNo,
              shipment.service,
              trackingResult
            );
            successCount++;
            console.log(`  ✅ Updated ${shipment.trackingNo}`);
          }

          // Add a small delay to avoid overwhelming the API
          await this.delay(500);
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`  ❌ Error updating ${shipment.trackingNo}:`, errorMessage);
          
          // Record error in database
          await trackingDatabaseService.recordError(
            shipment.trackingNo,
            shipment.service,
            errorMessage
          );
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Tracking update completed in ${duration}s - Success: ${successCount}, Errors: ${errorCount}`);
    } catch (error) {
      console.error('❌ Error in tracking update:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manually trigger an update
   */
  async triggerUpdate(): Promise<void> {
    console.log('🔄 Manually triggering tracking update...');
    await this.updateTrackedShipments();
  }

  /**
   * Get cron job status
   */
  getStatus(): { running: boolean; updating: boolean } {
    return {
      running: this.cronJob !== null,
      updating: this.isRunning,
    };
  }

  /**
   * Helper function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const trackingCronService = new TrackingCronService();

