import TrackedShipment, { ITrackedShipment } from '../models/tracked-shipment.model';
import { TrackingResponse } from '../types/shipment-tracking.types';

/**
 * Service for managing tracked shipments in the database
 */
export class TrackingDatabaseService {
  /**
   * Save or update a tracked shipment
   */
  async saveTrackedShipment(
    trackingNo: string,
    service: 'purolator' | 'ups' | 'stampede' | 'fedex' | 'dhl' | 'other',
    trackingResponse: TrackingResponse
  ): Promise<ITrackedShipment> {
    try {
      // Use the static findOrCreate method
      const tracked = await (TrackedShipment as any).findOrCreate(
        trackingNo,
        service,
        trackingResponse
      );
      return tracked;
    } catch (error) {
      console.error('Error saving tracked shipment:', error);
      throw error;
    }
  }

  /**
   * Get a tracked shipment by tracking number and service
   * @param selectFields - Optional fields to select (for optimization)
   * @param lean - Whether to return plain JS object (default: false)
   */
  async getTrackedShipment(
    trackingNo: string,
    service: string,
    selectFields?: string,
    lean: boolean = false
  ): Promise<ITrackedShipment | any | null> {
    try {
      let query = TrackedShipment.findOne({ trackingNo, service });

      if (selectFields) {
        query = query.select(selectFields);
      }

      if (lean) {
        return await query.lean();
      }

      return await query;
    } catch (error) {
      console.error('Error getting tracked shipment:', error);
      throw error;
    }
  }

  /**
   * Get all tracked shipments
   */
  async getAllTrackedShipments(): Promise<ITrackedShipment[]> {
    try {
      return await TrackedShipment.find().sort({ lastUpdated: -1 });
    } catch (error) {
      console.error('Error getting all tracked shipments:', error);
      throw error;
    }
  }

  /**
   * Get all active tracked shipments
   */
  async getActiveTrackedShipments(): Promise<ITrackedShipment[]> {
    try {
      return await TrackedShipment.find({ isActive: true }).sort({ lastUpdated: 1 });
    } catch (error) {
      console.error('Error getting active tracked shipments:', error);
      throw error;
    }
  }

  /**
   * Get tracked shipments that need updating (older than specified minutes)
   * Excludes shipments with status "DEL" (Delivered)
   * Optimized: Only selects trackingNo and service fields
   */
  async getShipmentsNeedingUpdate(olderThanMinutes: number = 15): Promise<any[]> {
    try {
      const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
      return await TrackedShipment.find({
        isActive: true,
        lastUpdated: { $lt: cutoffTime },
        'trackingResponse.shipment.isDelivered': { $ne: true },
      })
        .select('trackingNo service')
        .sort({ lastUpdated: 1 })
        .lean();
    } catch (error) {
      console.error('Error getting shipments needing update:', error);
      throw error;
    }
  }

  /**
   * Update tracking response for a shipment
   */
  async updateTrackingResponse(
    trackingNo: string,
    service: string,
    trackingResponse: TrackingResponse
  ): Promise<ITrackedShipment | null> {
    try {
      const shipment = await TrackedShipment.findOne({ trackingNo, service });
      if (!shipment) {
        return null;
      }
      return await shipment.updateTracking(trackingResponse);
    } catch (error) {
      console.error('Error updating tracking response:', error);
      throw error;
    }
  }

  /**
   * Record an error for a tracked shipment
   */
  async recordError(
    trackingNo: string,
    service: string,
    errorMessage: string
  ): Promise<ITrackedShipment | null> {
    try {
      const shipment = await TrackedShipment.findOne({ trackingNo, service });
      if (!shipment) {
        return null;
      }
      return await shipment.recordError(errorMessage);
    } catch (error) {
      console.error('Error recording error:', error);
      throw error;
    }
  }

  /**
   * Deactivate a tracked shipment
   */
  async deactivateShipment(trackingNo: string, service: string): Promise<ITrackedShipment | null> {
    try {
      return await TrackedShipment.findOneAndUpdate(
        { trackingNo, service },
        { isActive: false },
        { new: true }
      );
    } catch (error) {
      console.error('Error deactivating shipment:', error);
      throw error;
    }
  }

  /**
   * Reactivate a tracked shipment
   */
  async reactivateShipment(trackingNo: string, service: string): Promise<ITrackedShipment | null> {
    try {
      return await TrackedShipment.findOneAndUpdate(
        { trackingNo, service },
        { isActive: true, errorCount: 0, lastError: undefined },
        { new: true }
      );
    } catch (error) {
      console.error('Error reactivating shipment:', error);
      throw error;
    }
  }

  /**
   * Delete a tracked shipment
   */
  async deleteTrackedShipment(trackingNo: string, service: string): Promise<boolean> {
    try {
      const result = await TrackedShipment.deleteOne({ trackingNo, service });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting tracked shipment:', error);
      throw error;
    }
  }

  /**
   * Get statistics about tracked shipments
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byService: Record<string, number>;
  }> {
    try {
      const [total, active, byService] = await Promise.all([
        TrackedShipment.countDocuments(),
        TrackedShipment.countDocuments({ isActive: true }),
        TrackedShipment.aggregate([
          { $group: { _id: '$service', count: { $sum: 1 } } },
        ]),
      ]);

      const serviceStats: Record<string, number> = {};
      byService.forEach((item: any) => {
        serviceStats[item._id] = item.count;
      });

      return {
        total,
        active,
        inactive: total - active,
        byService: serviceStats,
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const trackingDatabaseService = new TrackingDatabaseService();

