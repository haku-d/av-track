import { ITrackingService } from './base-tracking.service';
import { purolatorTrackingService } from './purolator-tracking.service';
import { upsTrackingService } from './ups-tracking.service';

/**
 * Supported carrier types
 */
export type CarrierType = 'purolator' | 'ups' | 'stampede' | 'fedex' | 'dhl';

/**
 * Registry of tracking services by carrier
 */
class TrackingServiceRegistry {
  private services: Map<CarrierType, ITrackingService> = new Map();

  constructor() {
    // Register Purolator service
    this.register('purolator', purolatorTrackingService);

    // Register UPS service
    this.register('ups', upsTrackingService);

    // TODO: Register other carriers as they are implemented
    // this.register('stampede', stampedeTrackingService);
    // this.register('fedex', fedexTrackingService);
    // this.register('dhl', dhlTrackingService);
  }

  /**
   * Register a tracking service for a carrier
   */
  register(carrier: CarrierType, service: ITrackingService): void {
    this.services.set(carrier, service);
  }

  /**
   * Get tracking service for a specific carrier
   * @param carrier - The carrier name
   * @returns The tracking service instance
   * @throws Error if carrier is not supported
   */
  getService(carrier: CarrierType): ITrackingService {
    const service = this.services.get(carrier);
    
    if (!service) {
      throw new Error(
        `Tracking service for carrier "${carrier}" is not implemented. ` +
        `Supported carriers: ${this.getSupportedCarriers().join(', ')}`
      );
    }

    return service;
  }

  /**
   * Check if a carrier is supported
   */
  isSupported(carrier: string): carrier is CarrierType {
    return this.services.has(carrier as CarrierType);
  }

  /**
   * Get list of supported carriers
   */
  getSupportedCarriers(): CarrierType[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get all registered services
   */
  getAllServices(): Map<CarrierType, ITrackingService> {
    return new Map(this.services);
  }
}

// Export singleton instance
export const trackingServiceRegistry = new TrackingServiceRegistry();

/**
 * Helper function to get tracking service by carrier name
 * @param carrier - The carrier name
 * @returns The tracking service instance
 */
export function getTrackingService(carrier: CarrierType): ITrackingService {
  return trackingServiceRegistry.getService(carrier);
}

/**
 * Helper function to check if carrier is supported
 */
export function isCarrierSupported(carrier: string): carrier is CarrierType {
  return trackingServiceRegistry.isSupported(carrier);
}

/**
 * Helper function to get list of supported carriers
 */
export function getSupportedCarriers(): CarrierType[] {
  return trackingServiceRegistry.getSupportedCarriers();
}

